exports.up = (pgm) => {
  pgm.createTable('cart_items', {
    id:         { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id:    { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    product_id: { type: 'uuid', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    quantity:   { type: 'integer', notNull: true, default: 1 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.addConstraint('cart_items', 'cart_unique_user_product', 'UNIQUE (user_id, product_id)')

  pgm.createTable('orders', {
    id:             { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id:        { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    address_id:     { type: 'uuid', references: 'addresses(id)', onDelete: 'SET NULL' },
    status:         { type: 'order_status', notNull: true, default: 'pending' },
    total:          { type: 'numeric(10,2)', notNull: true },
    discount:       { type: 'numeric(10,2)', notNull: true, default: 0 },
    coupon_code:    { type: 'varchar(50)' },
    payment_status: { type: 'payment_status', notNull: true, default: 'unpaid' },
    created_at:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.sql(`
    CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `)

  pgm.createIndex('orders', 'user_id')
  pgm.createIndex('orders', ['status', 'created_at'])

  pgm.createTable('order_items', {
    id:                { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id:          { type: 'uuid', notNull: true, references: 'orders(id)', onDelete: 'CASCADE' },
    product_id:        { type: 'uuid', references: 'products(id)', onDelete: 'SET NULL' },
    quantity:          { type: 'integer', notNull: true },
    price_at_purchase: { type: 'numeric(10,2)', notNull: true },
  })

  pgm.createIndex('order_items', 'order_id')
}

exports.down = (pgm) => {
  pgm.dropTable('order_items')
  pgm.dropTable('orders')
  pgm.dropTable('cart_items')
}