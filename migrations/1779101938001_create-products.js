exports.up = (pgm) => {
  pgm.createTable('products', {
    id:          { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    seller_id:   { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    category_id: { type: 'uuid', references: 'categories(id)', onDelete: 'SET NULL' },
    name:        { type: 'varchar(255)', notNull: true },
    slug:        { type: 'varchar(255)', notNull: true, unique: true },
    description: { type: 'text' },
    price:       { type: 'numeric(10,2)', notNull: true },
    stock:       { type: 'integer', notNull: true, default: 0 },
    is_active:   { type: 'boolean', notNull: true, default: true },
    created_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.sql(`
    ALTER TABLE products ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', name || ' ' || COALESCE(description, ''))
    ) STORED;

    CREATE INDEX idx_products_search ON products USING GIN(search_vector);

    CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `)

  pgm.createIndex('products', 'seller_id')
  pgm.createIndex('products', 'category_id')
  pgm.createIndex('products', ['is_active', 'created_at'])

  pgm.createTable('product_images', {
    id:         { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    product_id: { type: 'uuid', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    url:        { type: 'text', notNull: true },
    sort_order: { type: 'integer', notNull: true, default: 0 },
  })

  pgm.createTable('reviews', {
    id:         { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id:    { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    product_id: { type: 'uuid', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    rating:     { type: 'smallint', notNull: true },
    comment:    { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.addConstraint('reviews', 'reviews_rating_range', 'CHECK (rating >= 1 AND rating <= 5)')
  pgm.addConstraint('reviews', 'reviews_unique_user_product', 'UNIQUE (user_id, product_id)')
}

exports.down = (pgm) => {
  pgm.dropTable('reviews')
  pgm.dropTable('product_images')
  pgm.dropTable('products')
}