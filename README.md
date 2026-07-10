# POS — Point of Sale System

Ein vollständiges, selbst gehostetes Point-of-Sale-System für Gastronomie und Veranstaltungsbetrieb. Entwickelt für den Einsatz auf Raspberry Pi (3/4) sowie Standard-Server-Hardware und Apple Silicon.

---

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Hardware](#hardware)
3. [Schnellstart](#schnellstart-für-einen-neuen-betreiber)
4. [Architektur](#architektur)
5. [Tech Stack](#tech-stack)
6. [Features](#features)
7. [Repository-Struktur](#repository-struktur)
8. [Datenmodell](#datenmodell)
9. [API-Referenz](#api-referenz)
10. [Konfiguration](#konfiguration)
11. [Entwicklung (lokal)](#entwicklung-lokal)
12. [Docker & Deployment](#docker--deployment)
13. [CI/CD & Releases](#cicd--releases)
14. [Testing](#testing)
15. [Produktiv-Deployment](#produktiv-deployment)

---

## Überblick

Das System verwaltet Produkte, Kategorien, Kassen-Stationen und Bestellungen. Bestellungen werden an einer Kasse aufgenommen, automatisch per Bon gedruckt und in Echtzeit auf stationsspezifischen TV-Bildschirmen (Vorlauf-Anzeige) dargestellt. Statistiken können zeitlich und nach Station/Produkt ausgewertet werden.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ Kassen-      │   │ Vorlauf-TV   │   │ Kundendisplay    │
│ Terminal     │   │ (pro Station)│   │ (zum Kunden)     │
│ (Touch)      │   │              │   │                  │
└──────┬───────┘   └──────┬───────┘   └────────┬─────────┘
       │  Browser (Chromium / beliebig)         │
       └──────────────────┼─────────────────────┘
                          │ HTTP + WebSocket
       ┌──────────────────▼──────────────────┐
       │   Nginx + Angular-UI (Container)     │  Port 80
       └──────────────────┬──────────────────┘
                          │
       ┌──────────────────▼──────────────────┐
       │   Flask REST API   (Port 3000)       │  ← auf dem Host (USB-Drucker)
       │   REST + Flask-SocketIO (Echtzeit)   │
       └──────┬──────────────────────┬────────┘
              │                      │
       ┌──────▼──────┐        ┌──────▼──────────┐
       │  MongoDB    │        │ ESC/POS-Drucker │
       │  (Container)│        │ USB (Thermobon) │
       └─────────────┘        └─────────────────┘
```

---

## Hardware

Getestete Referenz-Konfiguration (ein Kassenplatz):

| Komponente | Empfehlung | Hinweise |
|---|---|---|
| **Rechner** | Raspberry Pi 4 (4 GB), 64-Bit Raspberry Pi OS | Pi 3 (arm/v7) läuft auch, ist aber spürbar langsamer. Auch jeder x86-Mini-PC/NUC möglich. |
| **Speicher** | SD-Karte ≥ 32 GB (besser: USB-SSD) | SSD deutlich robuster + schneller für die DB |
| **Touchscreen** | beliebiger HDMI-Touchmonitor | für das Kassen-Terminal; Bedienung per Finger |
| **Bondrucker** | Epson TM-T88III (USB) | ESC/POS-kompatibel. IDs im Code: `idVendor=0x0456`, `idProduct=0x0808`. Andere ESC/POS-Drucker gehen mit angepassten IDs/Profil. |
| **Bonrolle** | Thermopapier 58 mm (oder 80 mm) | Papierbreite in den Einstellungen wählbar |
| **Vorlauf-TVs** | je Station ein TV/Monitor mit Browser | z.B. günstiger Mini-PC/Fire-Stick/Pi im Kiosk-Modus auf `/preview` |
| **Kundendisplay** | zweiter Monitor am Kassenplatz | zeigt `/customer-display`; per HDMI-Splitter oder zweitem Ausgang |
| **Netzwerk** | LAN (empfohlen) oder stabiles WLAN | alle Geräte im selben Netz wie der Pi |

**Wie es zusammenhängt:**
- **Ein Pi** betreibt DB + UI (Container) und die API (direkt, wegen USB-Drucker).
- Der **Drucker** hängt per USB am Pi.
- **Kassen-Terminal, Vorlauf-TVs und Kundendisplay** sind einfach Browser (auf dem Pi selbst oder anderen Geräten im Netz), die die jeweilige Seite öffnen.
- Wichtig: Kasse und Kundendisplay synchronisieren über `localStorage` → müssen im **selben Browser/Gerät** laufen (z.B. zwei Bildschirme am Pi).

---

## Schnellstart (für einen neuen Betreiber)

```bash
# 1. Voraussetzungen auf dem Pi
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER
# ab-/anmelden, damit die docker-Gruppe greift

# 2. Repo holen
git clone https://github.com/mbay-ODW/POS.git && cd POS

# 3. Konfiguration
cp local.env.example .env      # .env liest die Host-API
nano .env                       # DATABASE_HOST=mongodb://localhost:27017, JWT_SECRET setzen

# 4. UI + DB starten (fertige Images, KEIN Bauen)
docker compose -f docker-compose_pi.yml up -d

# 5. API einrichten + starten (USB-Drucker)
sudo apt install -y python3-venv python3-dev build-essential libffi-dev libusb-1.0-0 libjpeg-dev zlib1g-dev
cd RestAPI && python3 -m venv venv && source venv/bin/activate
pip install --upgrade pip && pip install -r requirements.txt
python server.py
```

Danach **UI im Browser** unter `http://<pi-ip>` öffnen. Erst-Login:
**`manager` / `manager123`** → sofort unter *Einstellungen → Benutzer* ändern.

Details, Autostart und Troubleshooting: siehe [Produktiv-Deployment](#produktiv-deployment).

---

## Architektur

### Frontend (Angular 19)

Single-Page-Application, ausgeliefert über Nginx. Kommuniziert mit der REST-API über HTTP und mit dem WebSocket-Server über socket.io für Echtzeit-Updates.

**Seiten / Routen:**

| Route | Komponente | Beschreibung |
|---|---|---|
| `/login` | `LoginComponent` | Anmeldung (JWT) |
| `/bookings` | `BookingComponent` | Kasse — Produkte nach Station, Warenkorb, Checkout |
| `/preview` | `PreviewComponent` | TV-Vorlauf — Echtzeit-Anzeige offener Bestellungen |
| `/customer-display` | `CustomerDisplayComponent` | Kundendisplay — Live-Warenkorb, Danke-/Pausentext (Vollbild) |
| `/statistics` | `StatisticsComponent` | Auswertungen mit Charts und Heatmap (nur Manager) |
| `/products` | `ProductsComponent` | Produktverwaltung (nur Manager) |
| `/orders` | `OrdersComponent` | Bestellübersicht, serverseitig paginiert (nur Manager) |
| `/categories` | `CategoriesComponent` | Kategorieverwaltung (nur Manager) |
| `/stations` | `StationsComponent` | Stationsverwaltung (nur Manager) |
| `/users` | `UsersComponent` | Benutzerverwaltung (nur Manager) |
| `/settings` | `SettingsComponent` | Systemeinstellungen, 5 Tabs (nur Manager) |
| `/home` | `HomeComponent` | Startseite |

**Dienste (`/services`):**

| Service | Funktion |
|---|---|
| `ProductsService` | CRUD Produkte, Filter nach Kategorie/Station |
| `OrdersService` | CRUD Bestellungen, Filter nach Station + Zeitfenster |
| `CategoriesService` | CRUD Kategorien |
| `StationsService` | CRUD Stationen |
| `SettingsService` | CRUD Einstellungen |
| `StatisticsService` | Aggregierte Statistik-Abfragen |
| `PrintService` | Bon-Druck via REST |
| `WebsocketService` | socket.io-Verbindung, `new_order`-Events |
| `NotificationService` | Snackbar-Benachrichtigungen |

### Backend (Flask / Python 3.12)

REST-API auf Basis von Flask-RESTX. Alle Endpunkte erben von `BaseList` (Collection) bzw. `SpecificBase` (einzelnes Dokument) — generische GET/POST/PUT/PATCH/DELETE-Implementierung.

**Schichten:**

```
server.py               ← App-Einstieg, Route-Registration, SocketIO-Init
resources/              ← HTTP-Handler (erben BaseList / SpecificBase)
utils/
  database.py           ← MongoDB-Singleton (lokal + Atlas)
  documents.py          ← Dekoratoren, Validierung, Serialisierung
  print.py              ← ESC/POS Bon-Druck (kategorisiert, mit Station)
  socketio_instance.py  ← Flask-SocketIO Singleton (optional; Fallback threading/Polling)
  log.py                ← Rotating File Logger, CI-resilient
  limiter.py            ← Rate Limiting via Flask-Limiter
  initialize.py         ← DB-Startup-Checks
  authentication.py     ← JWT-Hilfsfunktionen
```

### Echtzeit (WebSocket)

Bei jeder neuen Bestellung emittiert `OrdersList.post()` ein `new_order`-Event via Flask-SocketIO. Die Vorlauf-Anzeige empfängt dieses Event sofort. Als robuster Fallback (v.a. auf dem Pi ohne eventlet) pollt sie zusätzlich alle 15 s (einstellbar unter *Einstellungen → Vorlauf*).

```
Kasse → POST /api/v1/orders
           │
           ▼
     Stock-Update (bulk_write)
           │
           ▼
     socketio.emit('new_order', {_id: ...})
           │
           ▼
     Alle Preview-Clients aktualisieren sich sofort
```

### Drucker

Der ESC/POS-Drucker (Epson TM-T88III via USB, idVendor=0x0456, idProduct=0x0808) wird **außerhalb des Containers** betrieben, da Docker keinen direkten USB-Zugriff erlaubt. Die REST-API läuft dafür direkt als `python server.py` auf dem Host.

**Bon-Aufbau:**
1. Stationsname (zentriert, fett)
2. Trennlinie `========`
3. Bestellnummer (letzte 6 Zeichen der MongoDB-ID)
4. Trennlinie `========`
5. Je Kategorie: Kategoriename als Header
6. Artikel: `Menge x ShortName` (fett)
7. Dünne Trennlinie `--------` zwischen Artikeln
8. Dicke Trennlinie `========` zwischen Kategorien
9. Gesamtanzahl aller Artikel
10. Papierschnitt

---

## Tech Stack

### Frontend

| Technologie | Version | Zweck |
|---|---|---|
| Angular | 19 | Framework |
| Angular Material | 19 | UI-Komponenten |
| Chart.js | latest | Statistik-Diagramme (Donut, Bar, Line) |
| socket.io-client | latest | WebSocket-Client |
| RxJS | 7.8 | Reaktive Programmierung |
| TypeScript | 5.x | Typsicherheit |
| Nginx | 1.25 | Production Webserver |

### Backend

| Technologie | Version | Zweck |
|---|---|---|
| Python | 3.12 | Laufzeitumgebung |
| Flask | latest | Web-Framework |
| Flask-RESTX | latest | REST-API + integrierte Swagger-UI |
| Flask-SocketIO | latest | WebSocket-Server |
| eventlet | latest | Async-Worker für SocketIO |
| PyMongo | latest | MongoDB-Treiber |
| Flask-Limiter | latest | Rate Limiting |
| python-escpos | latest | Bondrucker-Ansteuerung |
| gunicorn | <22 | WSGI-Server (eventlet-Worker) |
| PyJWT | latest | JWT-Authentifizierung |
| Flask Monitoring Dashboard | latest | Performance-Monitoring |

### Infrastruktur

| Technologie | Zweck |
|---|---|
| MongoDB 6+ | Primäre Datenbank (lokale Instanz oder Atlas) |
| Docker / Compose | Containerisierung |
| Traefik | Reverse Proxy + TLS (Produktion) |
| Authelia | Authentifizierung (Produktion) |
| GitHub Actions | CI/CD-Pipelines |
| GHCR | Container Registry |

---

## Features

### Kassensystem (`/bookings`)
- Stationsauswahl mit localStorage-Persistenz (bleibt nach Reload)
- Automatische Filterung auf stationsspezifische Kategorien und Produkte
- Nur aktive Produkte (`active: true`) werden angezeigt
- Alphabetische Sortierung nach Name (Deutsch/Umlaute korrekt)
- Warenkorb mit Mengensteuerung (+1 / -1 / Entfernen)
- Checkout: Bestellung erstellen → Stock dekrementieren → Bon drucken
- Checkout gesperrt ohne ausgewählte Station
- Gesamtpreis in Echtzeit

### Vorlauf-Anzeige (`/preview`)
- Vollbild-TV-Layout (dunkles Theme, große Schrift)
- Stationsauswahl pro Bildschirm (localStorage)
- **Echtzeit-Updates via WebSocket** — sofortige Aktualisierung bei neuer Bestellung
- 60-Sekunden-Polling als Fallback
- Vorlauf-Zeitfenster konfigurierbar pro Station (in Minuten)
- Zeigt aggregierte Produktmengen (gleiche Produkte werden summiert)
- Sortierung nach Menge (meistbestellte oben)
- Leerzustand-Anzeige wenn keine offenen Bestellungen

### Statistik (`/statistics`)
- **Filter**: Datumsbereich (Von/Bis) + Stationsauswahl
- **Summary-Kacheln**: Gesamtbestellungen, Umsatz, Produktvielfalt
- **Donut-Chart**: Top 10 Produkte nach verkaufter Menge (Chart.js)
- **Balken-Chart**: Bestellungen nach Uhrzeit (0–23 Uhr)
- **Linien-Chart**: Bestellungen im Zeitverlauf (täglich)
- **Heatmap**: Auslastung nach Wochentag × Stunde (CSS-Grid, Hover-Tooltips)
- **Stationstabelle**: Bestellungen und Umsatz je Station
- **Produkttabelle**: Menge und Umsatz je Produkt im Zeitraum

### Bon-Druck
- Stationsname im Kopf
- Bestellnummer (Kurzform der MongoDB-ID)
- Artikel nach Kategorie gruppiert mit Kategorieheader
- Dünne Trennlinie zwischen Artikeln
- Dicke Trennlinie zwischen Kategorien
- ShortName des Produkts
- Gesamtanzahl

### Produktverwaltung (`/products`)
- Produktname, Kurzname (ShortName), Kategorie, Preis, Bestand
- Aktiv/Inaktiv-Toggle (inaktive Produkte erscheinen nicht in der Kasse)
- Schwellwerte für Lagerbestand-Warnungen (Info, Warning)
- Produktbild (Base64, wird in der Kasse angezeigt)
- Badge zeigt aktuellen Bestand farblich (grün/gelb/rot)

### Stationsverwaltung (`/stations`)
- Station mit zugeordneten Kategorien (n:m Beziehung)
- Vorlauf-Zeitfenster (Minuten) pro Station für TV-Anzeige
- Grundlage für Produktfilterung in Kasse und Preview

### Einstellungen (`/settings`)
- Generischer Key-Value-Store für Systemkonfiguration
- Name, Beschreibung, Wert

---

## Repository-Struktur

```
POS/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Tests + Multi-Arch Build bei Push auf main
│       ├── release.yml             # Versionierter Release bei git tag v*.*.*
│       ├── build-docker-images.yml # Docker Build (direkt + workflow_call)
│       ├── deploy-prod.yml         # Produktiv-Deployment
│       ├── deploy-testing.yml      # Test-Deployment
│       └── API-Testing.yml         # Integrations-Tests gegen echte DB
│
├── RestAPI/                        # Python Flask Backend
│   ├── server.py                   # App-Einstieg, Route-Registrierung, SocketIO
│   ├── wsgi.py                     # WSGI-Einstieg für gunicorn
│   ├── requirements.txt            # Python-Abhängigkeiten
│   ├── Dockerfile                  # Production Image (Python slim)
│   ├── flask_config.cfg            # Flask Monitoring Dashboard Konfiguration
│   ├── logo.png                    # Logo für Bon-Druck
│   ├── resources/
│   │   ├── base.py                 # Generische BaseList + SpecificBase Klassen
│   │   ├── products.py             # Produkt-Endpoints
│   │   ├── orders.py               # Bestell-Endpoints + Stock-Update + SocketIO-Emit
│   │   ├── categories.py           # Kategorie-Endpoints
│   │   ├── stations.py             # Stations-Endpoints
│   │   ├── settings.py             # Einstellungs-Endpoints
│   │   ├── carts.py                # Warenkorb-Endpoints
│   │   ├── statistics.py           # Aggregations-Endpoint (MongoDB Pipeline)
│   │   └── health.py               # Health-Check
│   ├── utils/
│   │   ├── database.py             # MongoDB-Singleton (lokal mongodb:// + Atlas mongodb+srv://)
│   │   ├── documents.py            # Dekoratoren (@log, @check_body_is_json, etc.)
│   │   ├── print.py                # ESC/POS Bondrucker (kategorisiert + Stationsname)
│   │   ├── socketio_instance.py    # Flask-SocketIO Singleton (eventlet async_mode)
│   │   ├── log.py                  # Rotating File Logger (CI-resilient: try/except)
│   │   ├── limiter.py              # Rate Limiter (Flask-Limiter)
│   │   ├── initialize.py           # DB-Startup-Checks
│   │   ├── authentication.py       # JWT-Hilfsfunktionen
│   │   ├── collections.yaml        # MongoDB Collection-Definitionen
│   │   └── settings.yaml           # Standard-Einstellungen
│   └── tests/                      # pytest Unit-Tests
│       ├── conftest.py             # mongomock Fixture, Flask Test Client
│       ├── requirements-test.txt   # Test-Abhängigkeiten
│       ├── test_products.py        # Produkt-Tests inkl. Active-Filter
│       ├── test_orders.py          # Bestell-Tests: Stock, Station-Filter, Rollback
│       ├── test_categories.py      # Kategorie-CRUD Tests
│       └── test_stations.py        # Stations-Tests inkl. vorlauf-Feld
│
├── UI/                             # Angular 19 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.module.ts           # NgModule: alle Komponenten + Material-Imports
│   │   │   ├── app-routing.module.ts   # Routing-Konfiguration
│   │   │   ├── app.component.*         # Root-Komponente + Navigationsmenü
│   │   │   ├── auth.interceptor.ts     # HTTP-Interceptor für JWT/Auth-Header
│   │   │   ├── booking/                # Kassenseite
│   │   │   ├── preview/                # Vorlauf-TV-Anzeige (WebSocket + Polling)
│   │   │   ├── statistics/             # Statistik-Seite (Chart.js)
│   │   │   ├── products/               # Produktverwaltung + Edit-Dialog + View-Dialog
│   │   │   ├── orders/                 # Bestellverwaltung + Edit + Print
│   │   │   ├── categories/             # Kategorieverwaltung + Edit + View
│   │   │   ├── stations/               # Stationsverwaltung + Edit + View
│   │   │   ├── settings/               # Einstellungsverwaltung + Edit + View
│   │   │   ├── home/                   # Startseite
│   │   │   ├── cart/                   # Warenkorb-Komponente
│   │   │   ├── navigation/             # Navigations-Komponente
│   │   │   ├── dialogs/
│   │   │   │   └── delete/             # Bestätigungs-Dialog für Löschoperationen
│   │   │   ├── interfaces/             # TypeScript Interfaces
│   │   │   │   ├── product.ts          # Product: name, shortName, category, price, stock, active
│   │   │   │   ├── order.ts            # Order: orders[], total, station_id; OrderDetails; Product
│   │   │   │   ├── category.ts         # Category: name
│   │   │   │   ├── station.ts          # Station: name, categories[], vorlauf
│   │   │   │   ├── setting.ts          # Setting: name, description, value
│   │   │   │   └── preview.ts          # Preview-Interface
│   │   │   ├── services/
│   │   │   │   ├── products.service.ts     # GET (mit queryParams), CRUD
│   │   │   │   ├── orders.service.ts       # CRUD, getOrdersByStationId(+vorlauf)
│   │   │   │   ├── categories.service.ts   # CRUD
│   │   │   │   ├── stations.service.ts     # CRUD + getById
│   │   │   │   ├── settings.service.ts     # CRUD
│   │   │   │   ├── statistics.service.ts   # GET /statistics mit Filtern
│   │   │   │   ├── print.service.ts        # POST /print/orders/:id
│   │   │   │   ├── websocket.service.ts    # socket.io connect/disconnect, onNewOrder()
│   │   │   │   └── notification.service.ts # MatSnackBar Wrapper (info/error)
│   │   │   └── environments/
│   │   │       ├── environment.ts          # Dev: localhost:3000
│   │   │       ├── environment.prod.ts     # Prod
│   │   │       └── environment.testing.ts  # Testing: testing-api.vfr-wuerzburg.de
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css              # Globale Styles
│   ├── Dockerfile                  # Multi-Stage: node:20-alpine → nginx:alpine
│   ├── Dockerfile_Local            # Lokales Entwicklungs-Image
│   ├── Dockerfile_Testing          # Test-Umgebungs-Image
│   ├── nginx.conf                  # Nginx SPA-Konfiguration
│   ├── angular.json                # Angular CLI Konfiguration
│   ├── package.json                # NPM-Abhängigkeiten
│   └── tsconfig.json               # TypeScript-Konfiguration
│
├── DataModel/                      # JSON-Schema Dokumentation (Referenz)
│   ├── products.json
│   ├── orders.json
│   └── settings.json
│
├── Testing/                        # Legacy Integrations-Tests (gegen laufende API)
│   ├── API/
│   │   ├── test_products.py        # requests-basierte API-Tests
│   │   └── test_orders.py
│   └── database/
│       ├── fill_dump_test_database.py  # Testdaten einspielen
│       └── populate_db.py
│
├── Database/                       # Lokales MongoDB-Datenverzeichnis (gitignored)
├── Logs/                           # Anwendungs-Logs (gitignored)
├── docker-compose.yml              # Produktiv-Stack (Traefik, Secrets, 2 Replicas)
├── docker-compose_local.yml        # Lokaler Dev-Stack (MongoDB + UI + API)
├── docker-compose_testing.yml      # Test-Stack
├── run.sh                          # Start-Skript (./run.sh production|testing)
├── local.env                       # Lokale Env-Variablen (gitignored!)
├── openapi.yml                     # OpenAPI-Spezifikation (WIP)
└── X509-cert.pem                   # MongoDB Atlas Zertifikat (gitignored)
```

---

## Datenmodell

### Product
```json
{
  "_id": "ObjectId",
  "name": "Weißbier",
  "shortName": "WB",
  "category": "ObjectId → Category",
  "active": true,
  "price": { "current": 4.50 },
  "stock": { "current": 48 },
  "thresholds": { "warning": 5, "info": 15 },
  "image": "data:image/png;base64,...",
  "creationTime": "ISODate",
  "lastModified": "ISODate",
  "createdBy": "username",
  "modifiedBy": "username"
}
```

### Order
```json
{
  "_id": "ObjectId",
  "orders": [
    {
      "product": {
        "id": "ObjectId",
        "name": "Weißbier",
        "shortName": "WB",
        "category": "ObjectId",
        "price": 4.50
      },
      "amount": 2
    }
  ],
  "total": 9.00,
  "station_id": "ObjectId → Station",
  "creationTime": "ISODate",
  "lastModified": "ISODate",
  "createdBy": "username"
}
```

### Station
```json
{
  "_id": "ObjectId",
  "name": "Bar",
  "categories": ["ObjectId", "ObjectId"],
  "vorlauf": 15,
  "creationTime": "ISODate",
  "lastModified": "ISODate"
}
```

### Category
```json
{
  "_id": "ObjectId",
  "name": "Getränke",
  "creationTime": "ISODate",
  "lastModified": "ISODate"
}
```

### Setting
```json
{
  "_id": "ObjectId",
  "name": "bon.footer",
  "description": "Fußzeile auf dem Bon",
  "value": "Danke für Ihren Besuch!",
  "creationTime": "ISODate",
  "lastModified": "ISODate"
}
```

### Beziehungen

```
Station ──── categories[] ────► Category ◄──── product.category ──── Product
                                                                          │
                                                          orders[].product.id
                                                                          │
Order ──────────────── station_id ───────────────────────────────► Station
```

**Produktfilterung in der Kasse:**
`Station.categories[]` → alle `Products` deren `category` in dieser Liste ist

**Vorlauf-Filterung:**
`Orders` wo `station_id == Station._id` und `creationTime >= jetzt - vorlauf_minuten`

---

## API-Referenz

Basis-URL: `http://<host>:3000/api/v1`

Swagger-UI verfügbar unter: `http://<host>:3000/`

### Gemeinsame Query-Parameter (GET Collections)

| Parameter | Typ | Beschreibung |
|---|---|---|
| `active` | `true`/`false` | Filter nach `active`-Feld |
| `skip` | Integer | Offset für Paginierung |
| `pageSize` | Integer | Maximale Anzahl Ergebnisse |
| `sortBy` | String | Sortierfeld (Standard: `_id`) |
| `fields` | String (kommagetrennt) | Projektion (nur diese Felder zurückgeben) |

### Produkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/products` | Alle Produkte (`?active=true` für Kasse) |
| `POST` | `/products` | Neues Produkt anlegen |
| `GET` | `/products/:id` | Einzelnes Produkt |
| `PUT` | `/products/:id` | Produkt vollständig ersetzen |
| `PATCH` | `/products/:id` | Einzelne Felder aktualisieren |
| `DELETE` | `/products/:id` | Produkt löschen |

### Bestellungen

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/orders` | Bestellungen (`?station_id=X&since=ISO` für Vorlauf) |
| `POST` | `/orders` | Neue Bestellung + Stock-Dekrement + `new_order` WebSocket-Event |
| `GET` | `/orders/:id` | Einzelne Bestellung |
| `PUT` | `/orders/:id` | Bestellung ändern + Stock-Korrektur (alt zurück, neu abziehen) |
| `DELETE` | `/orders/:id` | Bestellung löschen + Stock zurückgeben |
| `POST` | `/print/orders/:id` | Bon drucken (ESC/POS, lädt Station + Kategorien aus DB) |

### Kategorien / Stationen / Einstellungen

| Methode | Pfad |
|---|---|
| `GET`, `POST` | `/categories`, `/stations`, `/settings` |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/:resource/:id` |

### Statistik

```
GET /statistics?from=2024-01-01T00:00:00Z&to=2024-12-31T23:59:59Z&station_id=<id>
```

**Response:**
```json
{
  "summary": {
    "total_orders": 42,
    "total_revenue": 186.50
  },
  "orders_by_hour": [
    { "hour": 0, "count": 0 },
    { "hour": 14, "count": 8 }
  ],
  "orders_by_day": [
    { "date": "2024-07-12", "count": 15 }
  ],
  "heatmap": [
    { "weekday": 5, "hour": 19, "count": 12 }
  ],
  "products": [
    { "name": "WB", "total_amount": 34, "total_revenue": 153.0 }
  ],
  "stations": [
    { "station_id": "...", "name": "Bar", "order_count": 28, "total_revenue": 126.0 }
  ]
}
```

`weekday`: 0=Montag … 6=Sonntag

### WebSocket-Events

Verbindung: `ws://<host>:3000` (socket.io)

| Event | Richtung | Payload |
|---|---|---|
| `new_order` | Server → Client | `{ "_id": "OrderId" }` |

---

## Konfiguration

### Backend-Umgebungsvariablen

| Variable | Beschreibung | Lokal | Atlas |
|---|---|---|---|
| `DATABASE_HOST` | MongoDB-Verbindung | `mongodb://mongodb:27017` | `mongodb+srv://cluster0.xxx.mongodb.net/` |
| `DATABASE_NAME` | Datenbankname | `POS` | `Production` |
| `DATABASE_CERT_FILE` | X.509-Zertifikat (Atlas) | nicht nötig | `/run/secrets/DATABASE_CERT_FILE` |
| `LOG_LEVEL` | Logging-Level | `DEBUG` | `WARNING` |
| `FLASK_MONITORING_DASHBOARD_CONFIG` | Dashboard-Config | `./flask_config.cfg` | |

> `local.env` ist in `.gitignore` — **niemals Credentials committen**.

### Frontend-Umgebungen

`UI/src/app/environments/`:

| Datei | `baseUrl` | Verwendung |
|---|---|---|
| `environment.ts` | `http://localhost:3000/api/v1` | `ng serve` (Dev) |
| `environment.prod.ts` | `http://localhost:3000/api/v1` | `ng build` (Prod) |
| `environment.testing.ts` | `https://testing-api.vfr-wuerzburg.de/api/v1` | Test-Build |

---

## Entwicklung (lokal)

### Voraussetzungen

- Docker Desktop (für MongoDB)
- Node.js 20+ und npm
- Python 3.12+

### 1. Backend starten

```bash
cd RestAPI
pip install -r requirements.txt

# Umgebungsvariablen
export DATABASE_HOST=mongodb://localhost:27017
export DATABASE_NAME=POS
export LOG_LEVEL=DEBUG

python server.py
# API läuft auf http://localhost:3000
# Swagger-UI: http://localhost:3000/
```

### 2. Frontend starten

```bash
cd UI
npm install
npm start
# Angular Dev-Server auf http://localhost:4200
# Proxy zur API auf localhost:3000 (in angular.json konfigurierbar)
```

### 3. Komplett-Stack via Docker Compose

```bash
# Umgebung konfigurieren
cp .env.example local.env
# local.env anpassen (DATABASE_HOST=mongodb://mongodb:27017)

# Stack starten
docker compose -f docker-compose_local.yml up -d

# Logs beobachten
docker compose -f docker-compose_local.yml logs -f api-local

# Stoppen
docker compose -f docker-compose_local.yml down
```

> **MongoDB-Version**: Die Image-Version in `docker-compose_local.yml` muss zur Version passen, mit der die Daten in `./Database/` erstellt wurden. `mongo:latest` kann bei Version-Sprüngen die bestehenden Daten nicht mehr lesen. Die aktuelle Datenversion steht in `Database/WiredTiger`.

### 4. Drucker lokal (ohne Container)

```bash
# Nur DB im Container
docker compose -f docker-compose_local.yml up -d mongodb

# API direkt starten (mit USB-Zugriff)
cd RestAPI && python server.py
```

---

## Docker & Deployment

### Container Images

| Image | Registry | Plattformen |
|---|---|---|
| `ghcr.io/mbay-odw/pos-api` | GitHub Container Registry | `linux/amd64`, `linux/arm64`, `linux/arm/v7` |
| `ghcr.io/mbay-odw/pos-ui` | GitHub Container Registry | `linux/amd64`, `linux/arm64`, `linux/arm/v7` |

**Plattform-Zuordnung:**

| Plattform | Hardware |
|---|---|
| `linux/amd64` | Standard-Server, Mac Intel |
| `linux/arm64` | Raspberry Pi 4 (64-Bit OS), Apple M1/M2/M3 |
| `linux/arm/v7` | Raspberry Pi 3, Raspberry Pi 4 (32-Bit OS) |

### Docker-Compose-Dateien

| Datei | Beschreibung |
|---|---|
| `docker-compose_local.yml` | Lokaler Dev-Stack: MongoDB, UI, API |
| `docker-compose_testing.yml` | Test-Umgebung |
| `docker-compose.yml` | Produktion: Traefik, Authelia, 2 Replicas, Docker Secrets |

### Produktions-Compose-Stack

```yaml
# Produktion verwendet:
# - Traefik als Reverse Proxy mit TLS
# - Authelia für Authentifizierung (middlewares-authelia)
# - 2 Replicas für UI und API
# - Docker Secrets für MongoDB X.509-Zertifikat
# - Rate Limiting via Traefik-Middleware
# - 3 Netzwerke: default (intern), traefik (Routing), ldap (Auth)
```

---

## CI/CD & Releases

### Workflow-Übersicht

```
Push auf main
    │
    ├──► ci.yml
    │       ├── test-backend (pytest)
    │       ├── test-frontend (ng build)
    │       └── build-and-push → GHCR :latest + :sha-xxx
    │
    └──► build-docker-images.yml
            ├── build-api → GHCR :latest
            └── build-ui  → GHCR :latest

git tag v1.2.3
    │
    └──► release.yml
            ├── test-backend
            ├── test-frontend
            ├── build-and-push → GHCR :v1.2.3, :v1.2, :v1, :latest
            └── github-release → Release-Notes + Image-Tabelle
```

### Release erstellen

```bash
# Aktuellen Stand taggen
git tag v1.0.0
git push origin v1.0.0
# → GitHub Release wird automatisch erstellt
# → Docker Images mit v1.0.0, v1.0, v1, latest werden gepusht
```

### Benötigte Repository-Secrets

| Secret | Workflow | Beschreibung |
|---|---|---|
| `GITHUB_TOKEN` | alle | Automatisch von GitHub bereitgestellt (GHCR push) |
| `MONGO_DB_HOST_DEV` | API-Testing | MongoDB Atlas Connection String |
| `MONGO_DB_DATABASE_DEV` | API-Testing | Datenbankname |
| `MONGO_DB_CERT_DEV` | API-Testing | X.509-Zertifikat (Base64) |

> Für GHCR-Push: Unter **Settings → Actions → General → Workflow permissions** muss `Read and write permissions` aktiviert sein.

---

## Testing

### Unit-Tests (pytest + mongomock)

Testen den Flask-Backend ohne echte Datenbankverbindung.

```bash
cd RestAPI
pip install -r tests/requirements-test.txt
pytest tests/ -v
```

| Datei | Testet |
|---|---|
| `test_products.py` | CRUD, Active-Filter (`?active=true/false`) |
| `test_orders.py` | Erstellen + Stock-Dekrement, Station-Filter, Delete-Rollback |
| `test_categories.py` | CRUD |
| `test_stations.py` | CRUD, vorlauf-Feld |

### Integrations-Tests

Testen gegen eine laufende API-Instanz mit echter MongoDB.

```bash
# API muss laufen
pytest Testing/API/ -v
```

### Frontend-Build-Check

```bash
cd UI && npm run build
```

---

## Produktiv-Deployment

### Raspberry Pi 4 — Setup aus frischem Clone

Der Pi nutzt `docker-compose_pi.yml`: inoffizieller ARM-MongoDB-Build +
das fertige UI-Image von GHCR (kein Bauen auf dem Pi). Die **API läuft direkt
auf dem Host** (nicht im Container) für USB-Drucker-Zugriff.

```bash
# 1. Docker installieren
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Repository klonen
git clone https://github.com/mbay-ODW/POS.git && cd POS

# 3. Konfiguration aus Vorlage
#    Die auf dem Host laufende API liest .env (nicht local.env!)
cp local.env.example .env
nano .env
#   DATABASE_HOST=mongodb://localhost:27017   (API läuft auf dem Host!)
#   DATABASE_NAME=POS                          (muss zum DB-Namen der Daten passen)
#   JWT_SECRET=...eigenes langes Secret...

# 4. Container starten (MongoDB + UI)
docker compose -f docker-compose_pi.yml up -d

# 5. Datenbank nachziehen (optional, falls vorhandene Daten)
#    Dump in ./Database/ legen oder via mongorestore einspielen

# 6. API direkt auf dem Host starten (USB-Drucker)
#    Systemabhängigkeiten (escpos/USB, bcrypt, Pillow):
sudo apt install -y python3-venv python3-dev build-essential libffi-dev libusb-1.0-0
cd RestAPI
python3 -m venv venv          # venv anlegen (PEP 668 auf Bookworm)
source venv/bin/activate       # aktivieren
pip install --upgrade pip
pip install -r requirements.txt
python server.py               # starten
```

> **Kein Build auf dem Pi!** `docker-compose_pi.yml` zieht das fertige,
> öffentliche UI-Image `ghcr.io/mbay-odw/pos-ui:latest` (Multi-Arch arm64 + arm/v7,
> von der CI gebaut). Kein `docker login` nötig, da das Package public ist.

**Updates einspielen** — nur ziehen, nichts bauen:

```bash
git pull                                        # Code + API-Updates
docker compose -f docker-compose_pi.yml pull    # neues UI-Image von GHCR
docker compose -f docker-compose_pi.yml up -d
cd RestAPI
source venv/bin/activate                        # venv aktivieren
pip install -r requirements.txt                 # falls neue Abhängigkeiten
python server.py                                # API auf dem Host neu starten
```

### API-Autostart (systemd)

Damit die API beim Booten automatisch startet (und nach Absturz neu startet),
statt sie manuell im Terminal zu starten — `/etc/systemd/system/pos-api.service`:

```ini
[Unit]
Description=POS REST API
After=network-online.target docker.service
Wants=network-online.target

[Service]
User=pi
WorkingDirectory=/home/pi/POS/RestAPI
ExecStart=/home/pi/POS/RestAPI/venv/bin/python server.py
EnvironmentFile=/home/pi/POS/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pos-api
sudo systemctl status pos-api          # Status prüfen
journalctl -u pos-api -f               # Live-Log
```

> Läuft die API per systemd, braucht der Nutzer USB-Druckerrechte:
> `sudo usermod -aG lp,dialout pi` (einmal, dann neu starten).
> Pfade (`pi`, `/home/pi/...`) ggf. an deinen Benutzer anpassen.

### Rollen & Benutzer

Beim ersten Start legt die API automatisch ein Manager-Konto an
(`manager` / `manager123`, Passwort via `DEFAULT_MANAGER_PASSWORD` überschreibbar).

| Rolle | Darf |
|---|---|
| **manager** | alles: Kasse, Vorlauf + Produkte, Kategorien, Stationen, Bestellungen, Statistik, Einstellungen, Benutzerverwaltung |
| **personal** | nur Kasse + Vorlauf |

Manager legt weiteres Personal unter *Einstellungen → Benutzer* an. **Standard-Passwort sofort ändern!**

### Kiosk-Modus (TV-Screens & Kundendisplay)

```bash
# Vorlauf-TV (pro Station):
chromium-browser --kiosk --noerrdialogs --disable-infobars http://<pi-ip>/preview

# Kundendisplay (am Kassenplatz):
chromium-browser --kiosk --noerrdialogs --disable-infobars http://<pi-ip>/customer-display

# Autostart via ~/.config/autostart/kiosk.desktop
[Desktop Entry]
Type=Application
Exec=chromium-browser --kiosk http://<pi-ip>/preview
```

Jeder Vorlauf-TV wählt beim ersten Aufruf seine Station — die Auswahl wird in `localStorage` gespeichert und bleibt nach Neustart bestehen.

> **Kundendisplay-Hinweis:** Kasse und Kundendisplay tauschen den Live-Warenkorb über `localStorage` aus und müssen daher im **selben Browser** laufen (z.B. zweiter Monitor am Pi per HDMI, nicht ein separates Netzwerkgerät).

### MongoDB-Version-Kompatibilität

MongoDB-Datendateien sind an eine Major-Version gebunden (kein Downgrade möglich):

| WiredTiger (in `Database/WiredTiger`) | MongoDB |
|---|---|
| `WiredTiger 11.x` | MongoDB 6.0 |
| `WiredTiger 12.x` | MongoDB 7.0 |
| `WiredTiger 13.x` | MongoDB 8.0 |

**Upgrade-Pfad:** Immer nur eine Major-Version auf einmal, vorher `featureCompatibilityVersion` prüfen und setzen.

---

## Lizenz

Siehe [LICENSE](LICENSE).
