exports.up = (pgm) => {
  pgm.createTable('payments', {
    id:           { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id:     { type: 'uuid', notNull: true, references: 'orders(id)', onDelete: 'CASCADE' },
    provider:     { type: 'varchar(50)', notNull: true },
    provider_ref: { type: 'varchar(255)' },
    amount:       { type: 'numeric(10,2)', notNull: true },
    status:       { type: 'payment_status', notNull: true, default: 'unpaid' },
    raw_response: { type: 'jsonb' },
    created_at:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('payments', 'order_id')

  pgm.createTable('coupons', {
    id:            { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    code:          { type: 'varchar(50)', notNull: true, unique: true },
    discount_type: { type: 'discount_type', notNull: true },
    value:         { type: 'numeric(10,2)', notNull: true },
    min_order:     { type: 'numeric(10,2)', notNull: true, default: 0 },
    max_uses:      { type: 'integer' },
    used_count:    { type: 'integer', notNull: true, default: 0 },
    expires_at:    { type: 'timestamptz' },
    is_active:     { type: 'boolean', notNull: true, default: true },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('coupons')
  pgm.dropTable('payments')
}