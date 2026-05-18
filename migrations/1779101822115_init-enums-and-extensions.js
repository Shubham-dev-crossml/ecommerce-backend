exports.up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

  pgm.createType('user_role', ['buyer', 'seller', 'admin'])
  pgm.createType('order_status', [
    'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  ])
  pgm.createType('payment_status', ['unpaid', 'paid', 'refunded', 'failed'])
  pgm.createType('discount_type', ['flat', 'percent'])
}

exports.down = (pgm) => {
  pgm.dropType('discount_type')
  pgm.dropType('payment_status')
  pgm.dropType('order_status')
  pgm.dropType('user_role')
  pgm.sql(`DROP EXTENSION IF EXISTS "pgcrypto"`)
}