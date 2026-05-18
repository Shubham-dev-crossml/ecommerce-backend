exports.up = (pgm) => {
  pgm.createTable('users', {
    id:            { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name:          { type: 'varchar(100)', notNull: true },
    email:         { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    role:          { type: 'user_role', notNull: true, default: 'buyer' },
    is_verified:   { type: 'boolean', notNull: true, default: false },
    is_active:     { type: 'boolean', notNull: true, default: true },
    verify_token:  { type: 'text' },
    reset_token:   { type: 'text' },
    reset_token_expires: { type: 'timestamptz' },
    refresh_token: { type: 'text' },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('users', 'email')
  pgm.createIndex('users', 'email', {
    name: 'idx_users_verified_email',
    where: 'is_verified = true'
  })

  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `)
}

exports.down = (pgm) => {
  pgm.dropTable('users')
  pgm.sql(`DROP FUNCTION IF EXISTS update_updated_at CASCADE`)
}