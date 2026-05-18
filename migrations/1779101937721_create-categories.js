exports.up = (pgm) => {
  pgm.createTable('categories', {
    id:        { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name:      { type: 'varchar(100)', notNull: true },
    slug:      { type: 'varchar(100)', notNull: true, unique: true },
    parent_id: { type: 'uuid', references: 'categories(id)', onDelete: 'SET NULL' },
    created_at:{ type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('categories', 'parent_id')
  pgm.createIndex('categories', 'slug')
}

exports.down = (pgm) => pgm.dropTable('categories')