#!/bin/bash
# ============================================================
# install_db.sh — Installa il database Cardano Day
# Uso: bash install_db.sh [--with-seed] [--reset]
# ============================================================

set -e

# Configura qui le credenziali
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="cardano_day"

MYSQL_CMD="mysql -h$DB_HOST -P$DB_PORT -u$DB_USER"
if [ -n "$DB_PASS" ]; then
    MYSQL_CMD="$MYSQL_CMD -p$DB_PASS"
fi

echo "======================================================"
echo " Sistema Cardano Day — Setup Database"
echo "======================================================"
echo " Host:     $DB_HOST:$DB_PORT"
echo " Database: $DB_NAME"
echo " Utente:   $DB_USER"
echo "------------------------------------------------------"

# --- Migration 001: tabelle principali ---
echo "[1/3] Creazione tabelle..."
$MYSQL_CMD < migrations/001_create_tables.sql
echo " SUCCESS - Database inizializzato"

# --- Migration 002: indici ---
echo "[2/3] Creazione indici..."
$MYSQL_CMD $DB_NAME < migrations/002_indexes.sql
echo " Indici creati"

# --- Migration 003: vincoli ---
echo "[3/3] Vincoli e check..."
$MYSQL_CMD $DB_NAME < migrations/003_constraints.sql
echo "Vincoli applicati"

# --- Seed opzionale ---
if [[ "$1" == "--with-seed" ]] || [[ "$2" == "--with-seed" ]]; then
    echo ""
    echo "[SEED] Inserimento dati di test..."
    $MYSQL_CMD $DB_NAME < seeds/seed.sql
    echo " Dati di test inseriti"
fi

# --- Reset opzionale ---
if [[ "$1" == "--reset" ]] || [[ "$2" == "--reset" ]]; then
    echo ""
    echo "[RESET] Ripristino dati di test..."
    $MYSQL_CMD $DB_NAME < seeds/reset.sql
    echo " Database ripristinato"
fi

echo ""
echo "======================================================"
echo "Database '$DB_NAME' pronto!"
echo "======================================================"

# Verifica rapida
echo ""
echo "Verifica tabelle:"
$MYSQL_CMD $DB_NAME -e "
SELECT table_name AS 'Tabella',
       table_rows AS 'Righe (stima)'
FROM information_schema.tables
WHERE table_schema = '$DB_NAME'
ORDER BY table_name;" 2>/dev/null || echo "(verifica manuale consigliata)"
