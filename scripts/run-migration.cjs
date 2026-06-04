// Suorittaa Supabase-migraation suoraan PostgreSQL-yhteydellä
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Suora yhteys IPv6-osoitteella
const pool = new Pool({
  host: '2a05:d018:837:ae00:5fe9:5b2f:98a5:7295',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Kesäkuu2026',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const client = await pool.connect();

  try {
    console.log('🔌 Yhdistetty Supabaseen. Suoritetaan migraatio...\n');
    await client.query(sql);
    console.log('✅ Migraatio suoritettu onnistuneesti!');
    console.log('   Taulu: public.notes');
    console.log('   RLS: SELECT, INSERT, UPDATE, DELETE — kaikille sallittu');
    console.log('   Realtime: käytössä');
  } catch (err) {
    console.error('❌ Virhe:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
