const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

 
app.use(cors());
app.use(bodyParser.json());

 
const db = new sqlite3.Database('./app_database.db', (err) => {
  if (err) return console.error('Error opening database:', err.message);
  console.log('Connected to SQLite database.');
});

 
db.serialize(() => {
   
  db.run(
    `CREATE TABLE IF NOT EXISTS job_summary (
      emp_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      work_hours_present INTEGER NOT NULL DEFAULT 0,
      available TEXT NOT NULL CHECK (available IN ('Yes', 'No'))
    )`
  );

   
  db.run(
    `CREATE TABLE IF NOT EXISTS employees (
      emp_no INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_name TEXT NOT NULL,
      location TEXT NOT NULL,
      mobile_number TEXT,
      number_of_jobs_done INTEGER DEFAULT 0,
      comments TEXT
    )`
  );
});

 
app.get('/job-summary', (req, res) => {
  const query = `SELECT * FROM job_summary ORDER BY 
                 CASE available WHEN 'Yes' THEN 1 ELSE 2 END, emp_id`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

 
app.post('/add-job-summary', (req, res) => {
  const { name, work_hours_present, available } = req.body;
  const query = `INSERT INTO job_summary (name, work_hours_present, available) VALUES (?, ?, ?)`;
  db.run(query, [name, work_hours_present, available], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ emp_id: this.lastID });
  });
});

app.post('/add-employee', (req, res) => {
  const { name, work_hours_present, available } = req.body;
  const query = `INSERT INTO job_summary (name, work_hours_present, available) VALUES (?, ?, ?)`;
  db.run(query, [name, work_hours_present, available], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ emp_id: this.lastID });
  });
});


 

  

app.post('/assign-job', (req, res) => {
  const { work_hours_required } = req.body;

  const selectQuery = `SELECT * FROM job_summary WHERE available = 'Yes' AND work_hours_present >= ? ORDER BY emp_id LIMIT 1`;
  const updateQuery = `UPDATE job_summary SET work_hours_present = work_hours_present - ?, available = CASE WHEN work_hours_present - ? > 0 THEN 'Yes' ELSE 'No' END WHERE emp_id = ?`;

  db.get(selectQuery, [work_hours_required], (err, row) => {
    if (err) return res.status(500).send(err.message);
    if (!row) return res.status(404).send('No suitable employee available.');

    const { emp_id } = row;
    db.run(updateQuery, [work_hours_required, work_hours_required, emp_id], function (err) {
      if (err) return res.status(500).send(err.message);
      res.json({ message: 'Job assigned successfully.', emp_id });
    });
  });
});





 
app.get('/employees', (req, res) => {
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});


app.post('/employees', (req, res) => {
  const { emp_name, location, mobile_number, comments } = req.body;
  const sql = `
    INSERT INTO employees (emp_name, location, mobile_number, comments)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [emp_name, location, mobile_number, comments], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ emp_no: this.lastID });
    }
  });
});

 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


 
