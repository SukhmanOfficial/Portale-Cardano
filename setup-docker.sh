#!/bin/bash
# ============================================================
# setup-docker.sh — Setup completo Sistema Cardano Day
# Esegui sul server Ubuntu con Docker
# ============================================================

echo "=== SETUP SISTEMA CARDANO DAY ==="

# 1. Crea rete Docker se non esiste
docker network create cardano-net 2>/dev/null || echo "Rete gia esistente"

# 2. Crea database MySQL
echo ""
echo "--- Creazione database ---"
docker exec mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS cardano_day CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'cardano_user'@'%' IDENTIFIED BY 'CardanoSecure2026!';
GRANT ALL PRIVILEGES ON cardano_day.* TO 'cardano_user'@'%';
FLUSH PRIVILEGES;
" 2>/dev/null || echo "Prova con: docker exec -it mysql mysql -u root -p"

# 3. Importa database.sql
echo ""
echo "--- Importazione database ---"
docker cp database.sql mysql:/tmp/database.sql
docker exec mysql mysql -u cardano_user -p"CardanoSecure2026!" cardano_day < /dev/null
docker exec mysql sh -c "mysql -u cardano_user -pCardanoSecure2026! cardano_day < /tmp/database.sql"
echo "Database importato"

# 4. Copia file nel container Apache
echo ""
echo "--- Copia file nel container Apache ---"
# Copia tutti i file del progetto
docker cp . apache:/var/www/html/
echo "File copiati"

# 5. Permessi
docker exec apache chown -R www-data:www-data /var/www/html/
docker exec apache chmod -R 755 /var/www/html/
echo "Permessi impostati"

# 6. Abilita mod_rewrite
docker exec apache a2enmod rewrite headers
docker exec apache service apache2 restart
echo "Apache riavviato con mod_rewrite"

echo ""
echo "=== SETUP COMPLETATO ==="
echo "Sito disponibile su: http://$(hostname -I | awk '{print $1}')"
