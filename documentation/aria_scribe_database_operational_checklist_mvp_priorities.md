# Aria Scribe – Database Operational Checklist & MVP Priorities

This addendum clarifies **which operational tasks are mandatory for the MVP launch** (to satisfy security, privacy, and baseline reliability) versus those that can be deferred to a post‑MVP hardening sprint.

---

## 1  Decision matrix

| ID      | Task                                                                     | Rationale                                           | MVP?                           | When to tackle if deferred        |
| ------- | ------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------ | --------------------------------- |
| **S‑1** | Full‑disk / volume encryption (LUKS or cloud‑native)                     | Meets APP 11 “protect from unauthorised access”     | **Yes**                        | n/a                               |
| **S‑2** | Secrets management (JWT secret, DB creds in Vault or systemd‑creds)      | Prevent accidental credential leak in repo          | **Yes**                        | n/a                               |
| **B‑1** | Automated logical backup (nightly `pg_dump`)                             | Disaster recovery within ≤24 h                      | **Yes**                        | n/a                               |
| **B‑2** | Monthly restore drill (into throw‑away VM)                               | Validates backup integrity                          |                                | Post‑MVP Month 1                  |
| **P‑1** | Connection pooling (pgbouncer with 100‑conn cap)                         | Protects Postgres from exhaustion under load spikes | **Yes**                        | n/a                               |
| **P‑2** | JSONB GIN index on `transcript_json`                                     | Speeds future keyword search                        |                                | “Search transcripts” milestone    |
| **P‑3** | Time‑based partitioning for audio/transcript tables                      | Keeps VACUUM fast at scale                          |                                | Scaling Sprint Q2 2026            |
| **L‑1** | Audio file lifecycle policy (30‑day auto‑purge) + orphan row cleanup job | Storage cost + privacy                              | **Yes**                        | n/a                               |
| **L‑2** | Soft‑delete columns on patients (if restore needed)                      | UX convenience, legal hold                          |                                | After MVP once UI wireframes done |
| **E‑1** | Distinct DB roles per env (`aria_dev`, `aria_stage`, `aria_prod`)        | Prevents prod‑dev mix‑ups                           | **Yes**                        | n/a                               |
| **E‑2** | CI drift check (`prisma migrate diff`)                                   | Stops schema drift                                  | **Yes**                        | n/a                               |
| **H‑1** | Read replica / HA with Patroni                                           | Zero‑downtime target                                |                                | Post‑revenue, uptime SLA phase    |
| **S‑3** | Partitioned `audit_logs` + compression                                   | Controls log growth                                 |                                | Security hardening Sprint         |
| **T‑1** | Jest RLS regression test suite                                           | Prevents privilege escalation regressions           | **Yes**                        | n/a                               |
| **O‑1** | `pg_stat_statements` & `postgres_exporter` dashboards                    | Visibility into slow queries                        | **Yes** (read‑only dashboards) | n/a                               |
| **O‑2** | Alerting rules (latency, disk >80 %)                                     | On‑call preparedness                                |                                | Ops Sprint after first beta       |

Legend: **S** = Security, **B** = Backup, **P** = Performance, **L** = Lifecycle, **E** = Env parity, **H** = High availability, **O** = Observability

---

## 2  Implementation snippets (for MVP items)

### S‑1  Encrypt the data volume (example)

```bash
# Assume fresh NVMe /dev/nvme1n1
sudo cryptsetup luksFormat /dev/nvme1n1
sudo cryptsetup open /dev/nvme1n1 pgdata_crypt
mkfs.ext4 /dev/mapper/pgdata_crypt
mkdir -p /var/lib/pgsql
echo '/dev/mapper/pgdata_crypt /var/lib/pgsql ext4 defaults 0 2' | sudo tee -a /etc/fstab
```

### B‑1  Nightly backup cron

```bash
cat <<'CRON' | sudo tee /etc/cron.d/aria_pg_backup
0 3 * * * postgres pg_dump -Fc aria_db > /var/backups/aria_db_$(date +\%F).dump
CRON
```

### P‑1  pgbouncer quick config

```ini
[databases]
aria_db = host=127.0.0.1 dbname=aria_db user=aria_owner password=STRONGPASS

[pgbouncer]
listen_port = 6432
max_client_conn = 100
pool_mode = transaction
```

### L‑1  S3 lifecycle rule (JSON)

```json
{
  "Rules": [
    {
      "ID": "ExpireAudio",
      "Prefix": "audio/",
      "Expiration": {"Days": 30},
      "Status": "Enabled"
    }
  ]
}
```

### T‑1  Sample Jest RLS test

```ts
it('cannot see other practice patients', async () => {
  const token = await supabase.auth.signInWithPassword({ email, password });
  const { data } = await supabase.from('patients').select('*');
  expect(data!.every(p => p.practice_id === myPracticeId)).toBe(true);
});
```

---

## 3  Recommendation

- **Include all items marked “Yes” in MVP** – they directly influence privacy compliance, data safety, or basic stability.
- Defer the rest but **create Jira tickets now** so scope creep is transparent.

> **Rule of thumb** – if a failure would cause either data loss or a privacy breach, it belongs in the MVP.

