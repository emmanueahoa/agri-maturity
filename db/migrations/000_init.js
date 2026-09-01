exports.up = async function(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('role').notNullable().defaultTo('user');
    t.integer('failed_logins').notNullable().defaultTo(0);
    t.integer('locked_until').nullable();
    t.integer('created_at').notNullable().defaultTo(knex.raw("(strftime('%s','now'))"));
  });

  await knex.schema.createTable('definitions', (t) => {
    t.string('id').primary();
    t.string('label').notNullable();
    t.json('definition_json').notNullable();
    t.integer('created_at').notNullable().defaultTo(knex.raw("(strftime('%s','now'))"));
  });

  await knex.schema.createTable('assessments', (t) => {
    t.string('id').primary();
    t.string('definition_id').notNullable().references('id').inTable('definitions').onDelete('CASCADE');
    t.string('company').notNullable();
    t.json('data').notNullable();
    t.integer('created_at').notNullable().defaultTo(knex.raw("(strftime('%s','now'))"));
  });

  await knex.schema.createTable('roadmap_rows', (t) => {
    t.string('id').primary();
    t.string('definition_id').notNullable().references('id').inTable('definitions').onDelete('CASCADE');
    t.string('dimension');
    t.string('sub_dimension');
    t.integer('level');
    t.string('transition');
    t.json('content');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('roadmap_rows');
  await knex.schema.dropTableIfExists('assessments');
  await knex.schema.dropTableIfExists('definitions');
  await knex.schema.dropTableIfExists('users');
};
