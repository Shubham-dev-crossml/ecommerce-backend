exports.up = (pgm) => {
  pgm.createTable('addresses', {
    id:         { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id:    { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    name:       { type: 'varchar(100)', notNull: true },
    phone:      { type: 'varchar(20)', notNull: true },
    line1:      { type: 'varchar(255)', notNull: true },
    line2:      { type: 'varchar(255)' },
    city:       { type: 'varchar(100)', notNull: true },
    state:      { type: 'varchar(100)', notNull: true },
    pincode:    { type: 'varchar(10)', notNull: true },
    is_default: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('addresses', 'user_id')
}

exports.down = (pgm) => pgm.dropTable('addresses')