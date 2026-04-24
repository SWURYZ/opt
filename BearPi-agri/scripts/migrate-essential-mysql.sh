#!/usr/bin/env bash
set -euo pipefail

SRC_HOST="${SRC_HOST:-47.108.58.107}"
SRC_PORT="${SRC_PORT:-3306}"
SRC_DB="${SRC_DB:-dream6}"
SRC_USER="${SRC_USER:-root}"
SRC_PASS="${SRC_PASS:-c0765083cd3f57ab}"

DST_HOST="${DST_HOST:-139.155.96.142}"
DST_PORT="${DST_PORT:-3306}"
DST_DB="${DST_DB:-dream6}"
DST_USER="${DST_USER:-root}"
DST_PASS="${DST_PASS:-c0765083cd3f57ab}"

TABLES=(
  app_user
  composite_rule
  device_control_command
  device_greenhouse_mapping
  device_status
  face_record
  greenhouse
  greenhouse_sensor_snapshot
  iot_device_command_log
  iot_device_telemetry
  light_schedule_execution_log
  light_schedule_rule
  linkage_action_log
  login_log
  rule_condition
  sensor_latest_data
  threshold_alert_record
  threshold_auto_poll_config
  threshold_rule
)

echo "Checking source ${SRC_HOST}:${SRC_PORT}/${SRC_DB}..."
mysql -h "$SRC_HOST" -P "$SRC_PORT" -u"$SRC_USER" -p"$SRC_PASS" -D "$SRC_DB" -e "SELECT 1" >/dev/null

echo "Checking target ${DST_HOST}:${DST_PORT}..."
mysql -h "$DST_HOST" -P "$DST_PORT" -u"$DST_USER" -p"$DST_PASS" -e "SELECT 1" >/dev/null

echo "Ensuring target database ${DST_DB} exists..."
mysql -h "$DST_HOST" -P "$DST_PORT" -u"$DST_USER" -p"$DST_PASS" -e "CREATE DATABASE IF NOT EXISTS \`${DST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

TMP_FILE="$(mktemp -t dream6-essential.XXXXXX.sql)"
trap 'rm -f "$TMP_FILE"' EXIT

echo "Dumping essential tables: ${TABLES[*]}"
mysqldump \
  -h "$SRC_HOST" -P "$SRC_PORT" -u"$SRC_USER" -p"$SRC_PASS" \
  --single-transaction --quick --routines --triggers --events \
  --hex-blob \
  --set-gtid-purged=OFF --column-statistics=0 \
  --add-drop-table \
  "$SRC_DB" "${TABLES[@]}" > "$TMP_FILE"

python3 - "$TMP_FILE" "$SRC_DB" "$DST_DB" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
src_db = sys.argv[2]
dst_db = sys.argv[3]
s = path.read_text(errors="ignore")
s = s.replace(f"CREATE DATABASE /*!32312 IF NOT EXISTS*/ `{src_db}`", f"CREATE DATABASE /*!32312 IF NOT EXISTS*/ `{dst_db}`")
s = s.replace(f"USE `{src_db}`;", f"USE `{dst_db}`;")
path.write_text(s)
PY

echo "Importing into target ${DST_HOST}:${DST_PORT}/${DST_DB}..."
mysql --binary-mode=1 -h "$DST_HOST" -P "$DST_PORT" -u"$DST_USER" -p"$DST_PASS" -D "$DST_DB" < "$TMP_FILE"

echo "Target table counts:"
for table in "${TABLES[@]}"; do
  mysql -N -h "$DST_HOST" -P "$DST_PORT" -u"$DST_USER" -p"$DST_PASS" -D "$DST_DB" -e "SELECT '${table}', COUNT(*) FROM \`${table}\`;"
done
