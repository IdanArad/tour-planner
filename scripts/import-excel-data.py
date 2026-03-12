#!/usr/bin/env python3
"""
Import researched venue/festival/booking data from Excel files into SQL.

Reads the 3 Excel files in researched-data/ and generates SQL INSERT statements
for the discovered_venues and discovered_events tables.

Usage:
  python3 scripts/import-excel-data.py > supabase/import-researched-data.sql
  # Then run in Supabase SQL Editor or psql

Requires: pip3 install openpyxl
"""

import openpyxl
import json
import re
import sys
from datetime import datetime


def escape_sql(val):
    """Escape a string for SQL insertion."""
    if val is None:
        return "NULL"
    s = str(val).strip()
    if not s:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def to_array(items):
    """Convert a list to a PostgreSQL array literal."""
    if not items:
        return "NULL"
    cleaned = [i.strip() for i in items if i and i.strip()]
    if not cleaned:
        return "NULL"
    escaped = [i.replace("'", "''") for i in cleaned]
    return "ARRAY[" + ", ".join(f"'{i}'" for i in escaped) + "]"


def clean_email(val):
    """Extract the first valid-looking email from a cell."""
    if not val:
        return None
    s = str(val).strip()
    emails = re.findall(r'[\w.+-]+@[\w.-]+\.\w+', s)
    return emails[0] if emails else None


def parse_capacity(val):
    """Parse capacity from various formats."""
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(int(val))
    s = str(val).strip().replace(",", "")
    m = re.match(r'(\d+)', s)
    return m.group(1) if m else "NULL"


def import_venues():
    """Import venues from Venues.xlsx."""
    wb = openpyxl.load_workbook("researched-data/Venues.xlsx", read_only=True)
    venues = []

    # Berlin sheet: Name, Size, Mail, Notes, summer 25, winter 26
    ws = wb["Berlin"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        if len(row) < 2: continue
        name = row[0]
        size = row[1] if len(row) > 1 else None
        mail = row[2] if len(row) > 2 else None
        notes = row[3] if len(row) > 3 else None
        if not name or not str(name).strip():
            continue
        venues.append({
            "source": "excel_import",
            "source_id": f"berlin_{len(venues)}",
            "name": str(name).strip(),
            "city": "Berlin",
            "country": "DE",
            "capacity": size,
            "booking_email": clean_email(mail),
            "notes": notes,
        })

    # Germany sheet: Country, Winter 26, Summer 25, City, Venue, Link, Mail, Guarantee, Notes
    ws = wb["Germany"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        if len(row) < 5: continue
        vals = list(row) + [None] * (9 - len(row))
        country, _, _, city, venue_name, link, mail, guarantee, notes = vals[:9]
        if not venue_name or not str(venue_name).strip():
            continue
        venues.append({
            "source": "excel_import",
            "source_id": f"germany_{len(venues)}",
            "name": str(venue_name).strip(),
            "city": str(city).strip() if city else None,
            "country": "DE",
            "capacity": None,
            "booking_email": clean_email(mail),
            "website_url": str(link).strip() if link and "http" in str(link) else None,
            "notes": notes,
        })

    # Europe sheet: Country, Summer 25, City, Venue, Link, Mail, Guarantee, Notes
    ws = wb["Europe"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        if len(row) < 4: continue
        vals = list(row) + [None] * (8 - len(row))
        country, _, city, venue_name, link, mail, guarantee, notes = vals[:8]
        if not venue_name or not str(venue_name).strip():
            continue
        # Map country names to ISO codes
        country_map = {
            "Austria": "AT", "Poland": "PL", "Hungary": "HU", "Czechia": "CZ",
            "Czech Republic": "CZ", "Netherlands": "NL", "Belgium": "BE",
            "France": "FR", "Italy": "IT", "Spain": "ES", "Portugal": "PT",
            "Switzerland": "CH", "Sweden": "SE", "Norway": "NO", "Denmark": "DK",
            "Finland": "FI", "UK": "GB", "United Kingdom": "GB", "Ireland": "IE",
            "Romania": "RO", "Bulgaria": "BG", "Croatia": "HR", "Serbia": "RS",
            "Slovenia": "SI", "Slovakia": "SK", "Lithuania": "LT", "Latvia": "LV",
            "Estonia": "EE", "Greece": "GR", "Luxembourg": "LU",
        }
        c = str(country).strip() if country else ""
        cc = country_map.get(c, c[:2].upper() if c else None)
        venues.append({
            "source": "excel_import",
            "source_id": f"europe_{len(venues)}",
            "name": str(venue_name).strip(),
            "city": str(city).strip() if city else None,
            "country": cc,
            "capacity": None,
            "booking_email": clean_email(mail),
            "website_url": str(link).strip() if link and "http" in str(link) else None,
            "notes": notes,
        })

    # Israel sheet (offset header on row 2)
    ws = wb["Israel"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[2:]:  # skip header rows
        if len(row) < 4:
            continue
        area, venue_name, link, guarantee = row[0], row[1], row[2], row[3] if len(row) > 3 else None
        capacity = row[4] if len(row) > 4 else None
        contact = row[5] if len(row) > 5 else None
        if not venue_name or not str(venue_name).strip():
            continue
        venues.append({
            "source": "excel_import",
            "source_id": f"israel_{len(venues)}",
            "name": str(venue_name).strip(),
            "city": str(area).strip() if area else "Israel",
            "country": "IL",
            "capacity": capacity,
            "booking_email": clean_email(contact),
            "website_url": str(link).strip() if link and "http" in str(link) else None,
        })

    wb.close()
    return venues


def import_festivals():
    """Import festivals from Festivals.xlsx."""
    wb = openpyxl.load_workbook("researched-data/Festivals.xlsx", read_only=True)
    events = []

    country_map = {
        "Austria": "AT", "Poland": "PL", "Hungary": "HU", "Czechia": "CZ",
        "Czech Republic": "CZ", "Netherlands": "NL", "Belgium": "BE",
        "France": "FR", "Italy": "IT", "Spain": "ES", "Portugal": "PT",
        "Switzerland": "CH", "Sweden": "SE", "Norway": "NO", "Denmark": "DK",
        "Finland": "FI", "UK": "GB", "United Kingdom": "GB", "Ireland": "IE",
        "Romania": "RO", "Bulgaria": "BG", "Croatia": "HR", "Serbia": "RS",
        "Slovenia": "SI", "Slovakia": "SK", "Lithuania": "LT", "Latvia": "LV",
        "Estonia": "EE", "Greece": "GR", "Germany": "DE", "DE": "DE",
        "Luxembourg": "LU",
    }

    # 2026 sheet: Country, Status, IG, Followup, Name, Dates, Web, Mail, Application dates, Notes
    ws = wb["2026"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        country, status, _, _, name, dates, web, mail = row[:8]
        app_dates = row[8] if len(row) > 8 else None
        notes = row[9] if len(row) > 9 else None
        if not name or not str(name).strip():
            continue
        c = str(country).strip() if country else ""
        cc = country_map.get(c, c[:2].upper() if c else None)
        events.append({
            "source": "excel_import",
            "source_id": f"fest2026_{len(events)}",
            "name": str(name).strip(),
            "country": cc,
            "website_url": str(web).strip() if web and "http" in str(web) else None,
            "booking_email": clean_email(mail),
            "dates_raw": str(dates).strip() if dates else None,
            "status": str(status).strip() if status else None,
            "notes": notes,
            "event_type": "festival",
        })

    # 2027 sheet: Country, Status, Month, Name, Dates, Web, Mail, Application dates, Notes
    ws = wb["2027"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        country, status, month, name, dates, web, mail = row[:7]
        if not name or not str(name).strip():
            continue
        c = str(country).strip() if country else ""
        cc = country_map.get(c, c[:2].upper() if c else None)
        events.append({
            "source": "excel_import",
            "source_id": f"fest2027_{len(events)}",
            "name": str(name).strip(),
            "country": cc,
            "website_url": str(web).strip() if web and "http" in str(web) else None,
            "booking_email": clean_email(mail),
            "dates_raw": str(dates).strip() if dates else None,
            "status": str(status).strip() if status else None,
            "event_type": "festival",
        })

    # festivalticker sheet: Country, Status, IG, Name, City, Dates, Website, Mail, Notes
    if "List from festivalticker" in wb.sheetnames:
        ws = wb["List from festivalticker"]
        rows = list(ws.iter_rows(values_only=True))
        for row in rows[1:]:
            country, status, _, name, city, dates, web, mail = row[:8]
            notes = row[8] if len(row) > 8 else None
            if not name or not str(name).strip():
                continue
            c = str(country).strip() if country else ""
            cc = country_map.get(c, c[:2].upper() if c else None)
            events.append({
                "source": "excel_festivalticker",
                "source_id": f"festivalticker_{len(events)}",
                "name": str(name).strip(),
                "city": str(city).strip() if city else None,
                "country": cc,
                "website_url": str(web).strip() if web and "http" in str(web) else None,
                "booking_email": clean_email(mail),
                "dates_raw": str(dates) if dates else None,
                "status": str(status).strip() if status else None,
                "event_type": "festival",
            })

    wb.close()
    return events


def import_bookings():
    """Import booking agencies/promoters from Bookings & Promoters.xlsx."""
    wb = openpyxl.load_workbook("researched-data/Bookings & Promoters .xlsx", read_only=True)
    contacts = []

    country_map = {
        "DE": "DE", "UK": "GB", "CZ": "CZ", "USA": "US", "Europe": None,
    }

    # Germany sheet: City, Name, Website, Email, Phone, Mail Sent, Follow up, Tour Message, Notes
    ws = wb["Germany"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        city, name, website, email, phone = row[:5]
        mail_sent = row[5] if len(row) > 5 else None
        notes = row[8] if len(row) > 8 else None
        if not name or not str(name).strip():
            continue
        contacts.append({
            "source": "excel_import",
            "name": str(name).strip(),
            "city": str(city).strip() if city else None,
            "country": "DE",
            "website_url": str(website).strip() if website and "http" in str(website) else None,
            "booking_email": clean_email(email),
            "phone": str(phone).strip() if phone else None,
            "contact_type": "booking_agency",
            "outreach_status": str(mail_sent).strip() if mail_sent else None,
            "notes": notes,
        })

    # Europe sheet: Country, Name, Website, Email, Phone, First mail, Follow up mail
    ws = wb["Europe"]
    rows = list(ws.iter_rows(values_only=True))
    for row in rows[1:]:
        country, name, website, email, phone = row[:5]
        mail_sent = row[5] if len(row) > 5 else None
        notes = row[8] if len(row) > 8 else None
        if not name or not str(name).strip():
            continue
        c = str(country).strip() if country else ""
        cc = country_map.get(c, c[:2].upper() if c else None)
        contacts.append({
            "source": "excel_import",
            "name": str(name).strip(),
            "country": cc,
            "website_url": str(website).strip() if website and "http" in str(website) else None,
            "booking_email": clean_email(email),
            "phone": str(phone).strip() if phone else None,
            "contact_type": "booking_agency",
            "outreach_status": str(mail_sent).strip() if mail_sent else None,
        })

    # Promoters sheet: Country, Name, Website, Email, Phone, Mail Sent, Follow up, Notes
    if "Promoters " in wb.sheetnames:
        ws = wb["Promoters "]
        rows = list(ws.iter_rows(values_only=True))
        for row in rows[1:]:
            country, name, website, email, phone = row[:5]
            mail_sent = row[5] if len(row) > 5 else None
            notes = row[7] if len(row) > 7 else None
            if not name or not str(name).strip():
                continue
            contacts.append({
                "source": "excel_import",
                "name": str(name).strip(),
                "country": str(country).strip() if country else None,
                "website_url": str(website).strip() if website and "http" in str(website) else None,
                "booking_email": clean_email(email),
                "phone": str(phone).strip() if phone else None,
                "contact_type": "promoter",
                "outreach_status": str(mail_sent).strip() if mail_sent else None,
                "notes": notes,
            })

    # Event Planners sheet
    if "Event Planners" in wb.sheetnames:
        ws = wb["Event Planners"]
        rows = list(ws.iter_rows(values_only=True))
        for row in rows[1:]:
            country, name, website, email, phone = row[:5]
            mail_sent = row[5] if len(row) > 5 else None
            if not name or not str(name).strip():
                continue
            contacts.append({
                "source": "excel_import",
                "name": str(name).strip(),
                "country": str(country).strip() if country else None,
                "website_url": str(website).strip() if website and "http" in str(website) else None,
                "booking_email": clean_email(email),
                "phone": str(phone).strip() if phone else None,
                "contact_type": "event_planner",
            })

    wb.close()
    return contacts


def main():
    print("-- Generated by import-excel-data.py")
    print("-- Imports researched venue/festival/booking data into discovered_venues and discovered_events")
    print(f"-- Generated at: {datetime.now().isoformat()}")
    print()
    print("BEGIN;")
    print()

    # Import venues
    venues = import_venues()
    print(f"-- Venues: {len(venues)} records from Venues.xlsx")
    print()
    for v in venues:
        name = escape_sql(v["name"])
        city = escape_sql(v.get("city"))
        country = escape_sql(v.get("country"))
        capacity = parse_capacity(v.get("capacity"))
        email = escape_sql(v.get("booking_email"))
        website = escape_sql(v.get("website_url"))
        source = escape_sql(v["source"])
        source_id = escape_sql(v.get("source_id"))
        raw = escape_sql(json.dumps({k: str(v2) if v2 is not None else None for k, v2 in v.items()}, ensure_ascii=False))

        print(f"INSERT INTO discovered_venues (source, source_id, name, city, country, capacity, booking_email, website_url, venue_type, raw_data)")
        print(f"VALUES ({source}, {source_id}, {name}, {city}, {country}, {capacity}, {email}, {website}, 'club', {raw})")
        print(f"ON CONFLICT DO NOTHING;")
        print()

    # Import festivals as discovered_events
    events = import_festivals()
    print(f"-- Festivals: {len(events)} records from Festivals.xlsx")
    print()
    for e in events:
        name = escape_sql(e["name"])
        city = escape_sql(e.get("city"))
        country = escape_sql(e.get("country"))
        website = escape_sql(e.get("website_url"))
        email = escape_sql(e.get("booking_email"))
        source = escape_sql(e["source"])
        source_id = escape_sql(e.get("source_id"))
        event_type = escape_sql(e.get("event_type", "festival"))
        fest_status = e.get("status", "")
        db_status = "active"
        if fest_status and "cancel" in str(fest_status).lower():
            db_status = "cancelled"
        raw = escape_sql(json.dumps({k: str(v2) if v2 is not None else None for k, v2 in e.items()}, ensure_ascii=False))

        print(f"INSERT INTO discovered_events (source, source_id, name, city, country, website_url, booking_email, event_type, status, raw_data)")
        print(f"VALUES ({source}, {source_id}, {name}, {city}, {country}, {website}, {email}, {event_type}, '{db_status}', {raw})")
        print(f"ON CONFLICT DO NOTHING;")
        print()

    # Import booking agencies/promoters as discovered_venues with venue_type set
    bookings = import_bookings()
    print(f"-- Booking agencies/promoters: {len(bookings)} records from Bookings & Promoters.xlsx")
    print()
    for b in bookings:
        name = escape_sql(b["name"])
        city = escape_sql(b.get("city"))
        country = escape_sql(b.get("country"))
        email = escape_sql(b.get("booking_email"))
        phone = escape_sql(b.get("phone"))
        website = escape_sql(b.get("website_url"))
        contact_type = b.get("contact_type", "booking_agency")
        raw = escape_sql(json.dumps({k: str(v2) if v2 is not None else None for k, v2 in b.items()}, ensure_ascii=False))

        # Store booking contacts in discovered_venues with a distinct venue_type
        print(f"INSERT INTO discovered_venues (source, source_id, name, city, country, booking_email, phone, website_url, venue_type, raw_data)")
        print(f"VALUES ('excel_import', {escape_sql(f'booking_{contact_type}_{len(bookings)}')}, {name}, {city}, {country}, {email}, {phone}, {website}, '{contact_type}', {raw})")
        print(f"ON CONFLICT DO NOTHING;")
        print()

    print("COMMIT;")
    print()
    print(f"-- Total: {len(venues)} venues, {len(events)} festivals, {len(bookings)} booking contacts")

    # Summary to stderr
    print(f"\nImport summary:", file=sys.stderr)
    print(f"  Venues:           {len(venues)}", file=sys.stderr)
    print(f"  Festivals:        {len(events)}", file=sys.stderr)
    print(f"  Booking contacts: {len(bookings)}", file=sys.stderr)
    print(f"  Total records:    {len(venues) + len(events) + len(bookings)}", file=sys.stderr)


if __name__ == "__main__":
    main()
