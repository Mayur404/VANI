require('dotenv').config();
const mariadb = require('mariadb');

let dbPool = null;

function getDbConfig() {
  if (process.env.DATABASE_HOST && process.env.DATABASE_USER && process.env.DATABASE_NAME) {
    return {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    };
  }

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    };
  }

  throw new Error('Missing database configuration.');
}

function getDbPool() {
  if (!dbPool) {
    dbPool = mariadb.createPool(getDbConfig());
  }

  return dbPool;
}

function parseDbError(error) {
  if (error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062)) {
    return { status: 409, message: 'A record with the same unique value already exists.' };
  }

  return { status: 500, message: 'Database operation failed.' };
}

function normalizePatientRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    phone_number: row.phone_number || null,
    age: row.age ?? null,
    blood_group: row.blood_group || null,
    insurance_id: row.insurance_id || null,
    chronic_conditions: row.chronic_conditions || null,
    healthcare_reports: [],
  };
}

function normalizeCustomerRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    phone_number: row.phone_number || null,
    loan_account_number: row.loan_account_number || null,
    outstanding_amount:
      row.outstanding_amount === null || row.outstanding_amount === undefined
        ? null
        : Number(row.outstanding_amount),
    due_date: row.due_date ? new Date(row.due_date).toISOString() : null,
  };
}

function setupEntityManagement(_server, app) {
  app.post('/patients', async (req, res) => {
    let connection;

    try {
      const {
        name,
        phone_number,
        age,
        gender,
        blood_group,
        emergency_contact_name,
        emergency_contact_phone,
        known_allergies,
        chronic_conditions,
        insurance_id,
        family_history,
      } = req.body || {};

      if (!String(name || '').trim()) {
        return res.status(400).json({ error: 'Patient name is required.' });
      }

      if (age !== null && age !== undefined) {
        const parsedAge = Number(age);
        if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
          return res.status(400).json({ error: 'Age must be a positive whole number.' });
        }
      }

      if (gender && !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender value.' });
      }

      connection = await getDbPool().getConnection();

      const insertResult = await connection.query(
        `INSERT INTO \`patients\`
          (\`name\`, \`phone_number\`, \`age\`, \`gender\`, \`emergency_contact_name\`,
           \`emergency_contact_phone\`, \`blood_group\`, \`known_allergies\`,
           \`chronic_conditions\`, \`family_history\`, \`insurance_id\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(name).trim(),
          phone_number || null,
          age ?? null,
          gender || null,
          emergency_contact_name || null,
          emergency_contact_phone || null,
          blood_group || null,
          known_allergies || null,
          chronic_conditions || null,
          family_history || null,
          insurance_id || null,
        ],
      );

      const [createdPatient] = await connection.query(
        `SELECT \`id\`, \`name\`, \`phone_number\`, \`age\`, \`blood_group\`, \`insurance_id\`, \`chronic_conditions\`
         FROM \`patients\`
         WHERE \`id\` = ?`,
        [Number(insertResult.insertId)],
      );

      return res.status(201).json(normalizePatientRow(createdPatient));
    } catch (error) {
      console.error('[Entities] Failed to create patient:', error);
      const parsed = parseDbError(error);
      return res.status(parsed.status).json({ error: parsed.message });
    } finally {
      if (connection) connection.release();
    }
  });

  app.post('/customers', async (req, res) => {
    let connection;

    try {
      const {
        name,
        phone_number,
        loan_account_number,
        outstanding_amount,
        due_date,
      } = req.body || {};

      if (!String(name || '').trim()) {
        return res.status(400).json({ error: 'Customer name is required.' });
      }

      if (!String(loan_account_number || '').trim()) {
        return res.status(400).json({ error: 'Loan account number is required.' });
      }

      if (outstanding_amount !== null && outstanding_amount !== undefined) {
        const parsedAmount = Number(outstanding_amount);
        if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
          return res.status(400).json({ error: 'Outstanding amount must be a valid number.' });
        }
      }

      connection = await getDbPool().getConnection();

      const insertResult = await connection.query(
        `INSERT INTO \`customers\`
          (\`name\`, \`phone_number\`, \`loan_account_number\`, \`outstanding_amount\`, \`due_date\`)
         VALUES (?, ?, ?, ?, ?)`,
        [
          String(name).trim(),
          phone_number || null,
          String(loan_account_number).trim(),
          outstanding_amount ?? null,
          due_date ? new Date(due_date) : null,
        ],
      );

      const [createdCustomer] = await connection.query(
        `SELECT \`id\`, \`name\`, \`phone_number\`, \`loan_account_number\`, \`outstanding_amount\`, \`due_date\`
         FROM \`customers\`
         WHERE \`id\` = ?`,
        [Number(insertResult.insertId)],
      );

      return res.status(201).json(normalizeCustomerRow(createdCustomer));
    } catch (error) {
      console.error('[Entities] Failed to create customer:', error);
      const parsed = parseDbError(error);
      return res.status(parsed.status).json({ error: parsed.message });
    } finally {
      if (connection) connection.release();
    }
  });
}

module.exports = { setupEntityManagement };
