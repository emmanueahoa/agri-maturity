exports.seed = async function(knex) {
  // Insert an admin user with password "adminpass" (change in production)
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('adminpass', 12);
  await knex('users').insert({ email: 'admin@example.com', password_hash: hash, role: 'admin' });

  // Minimal default definition stub (you can extend with full JSON exported from the legacy app)
  const def = {
    id: 'default',
    label: 'Default',
    dimensions: [
      { id: 'd1', label: 'Dimension 1', criteria: [] }
    ]
  };
  await knex('definitions').insert({ id: 'default', label: 'Default', definition_json: JSON.stringify(def) });
};
