const express = require('express');
const router = express.Router();
const qrcode = require('qrcode');
const mysql = require('mysql');

const connection = mysql.createPool({
  host:'localhost',
  database: 'hrms_testing',
  user: 'root',
  password :''
})
router.get('/textconnection', (req, res) =>{
  if(connection != null){
    res.send('success')
  }
  else{
    res.send('failed')
  }
})

/* GET home page. */
router.get('/', (req, res) =>{
  var sql = 'SELECT * FROM entry UNION SELECT * FROM exit_leave';
  connection.query(sql, (err, rs) =>{
    var empList = rs
    var sql = 'SELECT COUNT(*) as Total FROM employees_enrolled';
    connection.query(sql, (err, rs) =>{
      var totalEmp = rs[0].Total
      var sql = 'SELECT COUNT(*) as Total FROM entry';
      connection.query(sql, (err, rs) =>{
        var totalEnt = rs[0].Total
        var sql = 'SELECT COUNT(*) as Total FROM exit_leave';
        connection.query(sql, (err, rs) =>{
          var totalExt = rs[0].Total
          res.render('index', { 
            title: 'Dashboard',
            empList, 
            totalEmp,
            totalEnt,
            totalExt
          });
        })
      })
    })
  })
});

/* GET deparment page. */
router.get('/department', function(req, res, next) {
  res.render('department', { title: 'Department' });
});

/* GET attendance list page. */
router.get('/record-attendance', function(req, res, next) {
  // var time = new Date().toLocaleTimeString();
  res.render('record-attendance', { 
    title: 'Record Attendance' ,
    empDetails: "",
    message:''
  }
  );
});
router.post('/confirm', (req, res) =>{
  // var time = new Date().toLocaleTimeString();
  let empInfo = req.body.result;
  var sql = 'SELECT * FROM employees_enrolled WHERE email = ?';
  connection.query(sql,[empInfo], (err, rs) =>{
    if(rs.length > 0){
      if(err) throw err;
      res.render('record-attendance', {
        title: 'Record Attendance',
        empDetails: rs[0],
        message:""
      })
    }
    else{
      const message =req.flash(req.body.email)
      res.render('record-attendance', {
        title: 'Record Attendance',
        empDetails:rs,
        message
      })
    }
  })
})
router.post('/attendance', (req, res) =>{
  let Staff_ID = req.body.staffid;
  let First_Name = req.body.first_name;
  let Last_Name = req.body.last_name;
  let Department = req.body.dept;
  let Date_today = req.body.date;
  let Time = req.body.time;
  let Email = req.body.email;
  let checkin_date = '';
  let checkin_time = '';
  let checkout_date = '';
  let checkout_time = '';
  var sql = 'SELECT * FROM entry WHERE email = ?';
  connection.query(sql,[Email], (err, rs) =>{
    if(rs.length > 0){
      if(rs[0].email == Email){
        var sql = 'DELETE FROM entry WHERE email = ?';
        connection.query(sql,[Email], (err, rs) =>{
          var sql = `INSERT INTO exit_leave (staff_id,first_name, last_name, email, department, date,
          out_time) VALUES(?,?,?,?,?,?,?)`;
          connection.query(sql, [Staff_ID,First_Name,Last_Name,Email,Department,Date_today,Time], (err, rs) =>{
            if(err) throw err;
            var sql = `INSERT INTO attendance_history (staff_id,first_name, last_name, email, department, date,
            out_time) VALUES(?,?,?,?,?,?,?)`;
            connection.query(sql, [Staff_ID,First_Name,Last_Name,Email,Department,Date_today,Time], (err, rs) =>{
              if(err) throw err;
              let sql = `SELECT id,email,date,out_time FROM exit_leave WHERE email = ? 
              AND in_time = "Checked Out" ORDER BY id DESC`;
              connection.query(sql,[Email, Email],(err, rs) =>{
                checkout_date = rs[0].date;
                checkout_time = rs[0].out_time
                console.log(Email+' checkout date '+checkout_date+' '+checkout_time)
                let sql = `SELECT id,email,date,in_time FROM attendance_history WHERE email = ?
                AND out_time = "Still In" ORDER BY id DESC`;
                connection.query(sql,[Email], (err, rs) =>{
                  checkin_date = rs[0].date
                  checkin_time = rs[0].in_time
                  console.log(Email+' checkin date '+checkin_date+' '+checkin_time)

                  // calculating hours
                  let checkout = new Date(checkout_date+' '+checkout_time);
                  console.log(checkout);
                  let checkin = new Date(checkin_date+' '+checkin_time);
                  console.log(checkin);

                  let timediff = checkout.getTime() - checkin.getTime();
                  console.log(timediff)

                  let msec = timediff;
                  let hh = Math.floor(msec / 1000 / 60 / 60);
                  msec -= hh * 1000 * 60 * 60;
                  let mm = Math.floor(msec / 1000 / 60);
                  msec -= mm * 1000 * 60;
                  let ss = Math.floor(msec / 1000);
                  msec -= ss * 1000;
                  console.log(hh+':'+mm+':'+ss);
                  
                  let Hours = hh; 
                  let Minutes = mm;
                  let Seconds = ss;
                  let sql = `INSERT INTO working_hours(staff_id, first_name, last_name,
                  email, date, hours, minutes, seconds) VALUES (?,?,?,?,?,?,?,?)`;
                  connection.query(sql,[Staff_ID,First_Name,Last_Name,Email,Date_today,Hours,Minutes,Seconds],(err, rs) =>{
                    res.redirect('/')
                  })
                })
              })
            })
          })
        })
      }
    }
    else{
      var sql = 'SELECT * FROM exit_leave WHERE email = ?';
      connection.query(sql, [Email], (err, rs) =>{
        if(rs.length === 0){        
          var sql = `INSERT INTO entry (staff_id,first_name, last_name, email, department, date,
          in_time) VALUES(?,?,?,?,?,?,?)`;
          connection.query(sql, [Staff_ID,First_Name,Last_Name,Email,Department,Date_today,Time], (err, rs) =>{
            if(err) throw err;
            var sql = `INSERT INTO attendance_history (staff_id,first_name, last_name, email, department, date,
            in_time) VALUES(?,?,?,?,?,?,?)`;
            connection.query(sql, [Staff_ID,First_Name,Last_Name,Email,Department,Date_today,Time], (err, rs) =>{
              if(err) throw err;
              res.redirect('/')
            })
          })    
        }
        else if(rs.length > 0){
          var sql = 'DELETE FROM exit_leave WHERE email = ?';
          connection.query(sql,[Email], (err, rs) =>{  
            var sql = `INSERT INTO entry (staff_id,first_name, last_name, email, department, date,
            in_time) VALUES(?,?,?,?,?,?,?)`;
            connection.query(sql, [Staff_ID,First_Name,Last_Name,Email,Department,Date_today,Time], (err, rs) =>{
              if(err) throw err;
              var sql = `INSERT INTO attendance_history (staff_id,first_name, last_name, email, department, date,
              in_time) VALUES(?,?,?,?,?,?,?)`;
              connection.query(sql, [Staff_ID,First_Name,Last_Name,Email,Department,Date_today,Time], (err, rs) =>{
                if(err) throw err;
                res.redirect('/')
              })
            })    
          })
        }
        else {
          res.redirect('record-attendance')
        }
      })
    }
  })
})

/* GET attendance report page. */
router.get('/attendance-report', function(req, res, next) {
  var sql = 'SELECT * FROM attendance_history';
  connection.query(sql, (err, rs) =>{
    res.render('attendance-report', { 
      title: 'Attendance Report',
      attendance: rs
    }
    );
  })
});
router.post('/filter-attendance', (req, res) =>{
  let From = req.body.from;
  let To = req.body.to;
  var sql = 'SELECT * FROM attendance_history WHERE date >= ? AND date <= ?';
  connection.query(sql,[From,To], (err, rs) =>{
    if(err) throw err;
    if(rs[0] == null){
      res.redirect('/attendance-report')
    }
    else{
      res.render('attendance-report', { 
        title: 'Attendance Report',
        attendance: rs
      }
      );
    }
  })
})

/* GET payroll list page. */
router.get('/payroll-list', function(req, res, next) {
  let sql = 'SELECT * FROM employees_enrolled'
  connection.query(sql, (err, rs) =>{
    res.render('payroll-list', {
      title: 'Payroll List' ,
      empInfo: rs
    }
    );
  })
});

/* GET generate salary page. */
router.get('/generate-salary', function(req, res, next) {
  // number of weekends in current month
  var d = new Date();
  var getTot = daysInMonth(d.getMonth(),d.getFullYear());
  var weekends = new Array();
  for(var i=1;i<=getTot;i++){
    var newDate = new Date(d.getFullYear(),d.getMonth(),i)
    if(newDate.getDay()==0 || newDate.getDay()==6){
      weekends.push(i)
    }
  }
  let today = new Date();
  let options = {
    month: "long"
  }
  let month = today.toLocaleDateString("en-us", options)
  console.log(month)
  let weekend_length = weekends.length
  // console.log('There are '+weekend_length+' weekends in '+month);
  // number of weekends in current month end

  // number of days in current month
  let getDays = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
  }
  let days_in_the_month = getDays(new Date().getFullYear(), 7);
  // console.log('There are '+days_in_the_month+' days in '+month)
  // number of days in current month end

  // calculating number of working days in current month
  let working_days = days_in_the_month - weekend_length;
  // console.log("There are "+working_days+" working days in "+month)
  // calculating number of working days in current month end

  let sql = 'SELECT * FROM employees_enrolled WHERE staff_id = ?'
  let Staff_ID = req.query.staff_id
  connection.query(sql,[Staff_ID],function(err, rs){
    if(rs.length > 0){
      let email = rs[0].email
      let empInfo = rs[0]
      let gross = rs[0].salary
      let sql = 'SELECT COUNT(*) as Total FROM attendance_history WHERE email = ? AND in_time = "Checked Out"';
      connection.query(sql, [email], (err, rs) =>{
        let number_of_days_worked = rs[0].Total;
        let sql = 'SELECT SUM (hours) as TotalHours FROM working_hours WHERE staff_id = ?';
        connection.query(sql,[Staff_ID], (err, rs) =>{
          let hours = rs[0].TotalHours;
          // console.log(hours)
          // console.log("number of days worked = "+number_of_days_worked)
          if(gross < "30000"){
            if(number_of_days_worked == 0){
              console.log("You do not have a salary");
              res.render('generate-salary',{
                title: 'Salary',
                hours:0,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted: 0,
                gross_perday_formatted: 0,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted: 0,
              });              
            }
            else{
              let days_worked = number_of_days_worked / 252;
  
              let relief_allowance = 0.2;
  
              let statutory_relief_perday = parseFloat(((((gross * relief_allowance + 200000) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let statutory_relief_perday_formatted = (statutory_relief_perday).toLocaleString();
              
              let gross_perday = parseFloat(((((gross * days_worked).toFixed(2)).toLocaleString())).replace(/,/g,''))
              let gross_perday_formatted = (gross_perday).toLocaleString();
  
              let netsalary_perday = parseFloat((((netsalary * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let netsalary_perday_formatted = (netsalary_perday).toLocaleString();
  
              let days_in_the_month = getDays(new Date().getFullYear(), 7);
              // console.log(days_in_the_month)
  
              console.log('You earn below minimum wage')
              res.render('generate-salary',{
                title: 'Salary',
                hours:hours,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted,
                gross_perday_formatted,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted,
              });
            }
          }
          else if(gross >= "30000" && gross < "625000"){
            if(number_of_days_worked == 0){
              console.log("You do not have a salary");
  
              res.render('generate-salary',{
                title: 'Salary',
                empInfo,
                hours:0,
                number_of_days_worked,
                statutory_relief_perday_formatted: 0,
                gross_perday_formatted: 0,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted: 0,
              });              
            }
            else{
              let days_worked = number_of_days_worked / 252;
              let relief_allowance = 0.2;
  
              let statutory_relief = gross * relief_allowance + 200000 
  
              let statutory_relief_perday = parseFloat(((((statutory_relief) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let statutory_relief_perday_formatted = (statutory_relief_perday).toLocaleString();
  
              let gross_perday = parseFloat(((((gross * days_worked).toFixed(2)).toLocaleString())).replace(/,/g,''))
              let gross_perday_formatted = (gross_perday).toLocaleString();
  
              let taxable_income = gross - statutory_relief
              let taxable_income_perday = parseFloat(((((taxable_income) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let taxable_income_perday_formatted = (taxable_income_perday).toLocaleString();
  
              let first_300 = taxable_income - 0;
  
              let tax = first_300 * 0.07;
              let tax_perday  = parseFloat(((((tax) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let tax_perday_formatted  = (tax_perday).toLocaleString();
              
              let netsalary = gross - tax;
              let netsalary_perday = parseFloat((((netsalary * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let netsalary_perday_formatted = (netsalary_perday).toLocaleString();
  
              // let work_days = number_of_days_worked / working_days;
              res.render('generate-salary',{
                title: 'Salary',
                hours:hours,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted,
                gross_perday_formatted,
                taxable_income_perday_formatted,
                tax_perday_formatted,
                netsalary_perday_formatted,
              });
            }
          }
          else if(gross >= "625000" && gross < "1000000"){
            if(number_of_days_worked == 0){
              console.log("You do not have a salary");
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:0,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted: 0,
                gross_perday_formatted: 0,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted: 0,
              });                  
            }
            else{
              let days_worked = number_of_days_worked / 252;
              let relief_allowance = 0.2;
  
              let statutory_relief = gross * relief_allowance + 200000 
              let statutory_relief_perday = parseFloat((((((statutory_relief) * days_worked)).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let statutory_relief_perday_formatted = (statutory_relief_perday).toLocaleString();
  
              let gross_perday = parseFloat(((((gross * days_worked).toFixed(2)).toLocaleString())).replace(/,/g,''))
              let gross_perday_formatted = (gross_perday).toLocaleString();
  
              let taxable_income = gross - statutory_relief
              let taxable_income_perday = parseFloat(((((taxable_income) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let taxable_income_perday_formatted = (taxable_income_perday).toLocaleString();
  
              let first_300 = 300000 * 0.07;
              let next_300 = (taxable_income - 300000)* 0.11;
  
              let tax = first_300 + next_300;
              let tax_perday  = parseFloat(((((tax) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let tax_perday_formatted  = (tax_perday).toLocaleString();
  
              let netsalary = gross - tax;
              let netsalary_perday = parseFloat((((netsalary * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let netsalary_perday_formatted = (netsalary_perday).toLocaleString();
              
              res.render('generate-salary',{
                title: 'Salary',
                hours:hours,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted,
                gross_perday_formatted,
                taxable_income_perday_formatted,
                tax_perday_formatted,
                netsalary_perday_formatted,
              });              
            }
          }
          else if(gross >= "1000000" && gross < "2250000"){
            if(number_of_days_worked == 0){
              console.log("You do not have a salary");
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:0,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted: 0,
                gross_perday_formatted: 0,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted: 0,
              });                  
            }
            else{
              let days_worked = number_of_days_worked / 252;
              let relief_allowance = 0.2;
  
              let statutory_relief = gross * relief_allowance + 200000 
              let statutory_relief_perday = parseFloat((((((statutory_relief) * days_worked)).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let statutory_relief_perday_formatted = (statutory_relief_perday).toLocaleString();
  
              let gross_perday = parseFloat(((((gross * days_worked).toFixed(2)).toLocaleString())).replace(/,/g,''))
              let gross_perday_formatted = (gross_perday).toLocaleString();
  
              let taxable_income = gross - statutory_relief
              let taxable_income_perday = parseFloat(((((taxable_income) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let taxable_income_perday_formatted = (taxable_income_perday).toLocaleString();
  
              let first_300 = 300000 * 0.07;
              let next_300 = 300000 * 0.11;
              let next_500 = 500000 * 0.15;
              let next_500_2 = (taxable_income - 1100000) * 0.19;
  
              let tax = first_300 + next_300 + next_500 + next_500_2;
              let tax_perday  = parseFloat(((((tax) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let tax_perday_formatted  = (tax_perday).toLocaleString();
              
              let netsalary = gross - tax;
              let netsalary_perday = parseFloat((((netsalary * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let netsalary_perday_formatted = (netsalary_perday).toLocaleString();
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:hours,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted,
                gross_perday_formatted,
                taxable_income_perday_formatted,
                tax_perday_formatted,
                netsalary_perday_formatted,
              });              
            }
          }
          else if(gross >= "2250000" && gross < "4250000"){
            if(number_of_days_worked == 0){
              console.log("You do not have a salary");
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:0,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted: 0,
                gross_perday_formatted: 0,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted: 0,
              });                  
            }
            else{
              let days_worked = number_of_days_worked / 252;
              let relief_allowance = 0.2;
  
              let statutory_relief = gross * relief_allowance + 200000 
              let statutory_relief_perday = parseFloat((((((statutory_relief) * days_worked)).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let statutory_relief_perday_formatted = (statutory_relief_perday).toLocaleString();
  
              let gross_perday = parseFloat(((((gross * days_worked).toFixed(2)).toLocaleString())).replace(/,/g,''))
              let gross_perday_formatted = (gross_perday).toLocaleString();
  
              let taxable_income = gross - statutory_relief
              let taxable_income_perday = parseFloat(((((taxable_income) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let taxable_income_perday_formatted = (taxable_income_perday).toLocaleString();
  
              let first_300 = 300000 * 0.07;
              let next_300 = 300000 * 0.11;
              let next_500 = 500000 * 0.15;
              let next_500_2 = 500000 * 0.19;
              let next_1600 = (taxable_income - 1600000) * 0.21;
  
              let tax = first_300 + next_300 + next_500 + next_500_2 + next_1600;
              let tax_perday  = parseFloat(((((tax) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let tax_perday_formatted  = (tax_perday).toLocaleString();
  
              let netsalary = gross - tax;
              let netsalary_perday = parseFloat((((netsalary * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let netsalary_perday_formatted = (netsalary_perday).toLocaleString();
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:hours,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted,
                gross_perday_formatted,
                taxable_income_perday_formatted,
                tax_perday_formatted,
                netsalary_perday_formatted,
              });              
            }
          }
          else if(gross >= "4250000"){
            if(number_of_days_worked == 0){
              console.log("You do not have a salary");
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:0,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted: 0,
                gross_perday_formatted: 0,
                taxable_income_perday_formatted: 0,
                tax_perday_formatted: 0,
                netsalary_perday_formatted: 0,
              });                  
            }
            else{
              let days_worked = number_of_days_worked / 252;
              let relief_allowance = 0.2;
  
              let statutory_relief = gross * relief_allowance + 200000 
              let statutory_relief_perday = parseFloat((((((statutory_relief) * days_worked)).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let statutory_relief_perday_formatted = (statutory_relief_perday).toLocaleString();
  
              let gross_perday = parseFloat(((((gross * days_worked).toFixed(2)).toLocaleString())).replace(/,/g,''))
              let gross_perday_formatted = (gross_perday).toLocaleString();
  
              let taxable_income = gross - statutory_relief
              let taxable_income_perday = parseFloat(((((taxable_income) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let taxable_income_perday_formatted = (taxable_income_perday).toLocaleString();
  
              let first_300 = 300000 * 0.07;
              let next_300 = 300000 * 0.11;
              let next_500 = 500000 * 0.15;
              let next_500_2 = 500000 * 0.19;
              let next_1600 = 1600000 * 0.21;
              let next_3200 = (taxable_income - 3200000) * 0.24;
  
              let tax = first_300 + next_300 + next_500 + next_500_2 + next_1600 + next_3200;
              let tax_perday  = parseFloat(((((tax) * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let tax_perday_formatted  = (tax_perday).toLocaleString();
  
              let netsalary = gross - tax;
              let netsalary_perday = parseFloat((((netsalary * days_worked).toFixed(2)).toLocaleString()).replace(/,/g,''));
              let netsalary_perday_formatted = (netsalary_perday).toLocaleString();
  
              res.render('generate-salary',{
                title: 'Salary',
                hours:hours,
                empInfo,
                number_of_days_worked,
                statutory_relief_perday_formatted,
                gross_perday_formatted,
                taxable_income_perday_formatted,
                tax_perday_formatted,
                netsalary_perday_formatted,
              });              
            }
          }
        })
      })
    }
    else{
      res.render('generate-salary',{
        title: 'Salary',
        hours:0,
        empInfo: '',
        number_of_days_worked,
        statutory_relief_perday_formatted: 0,
        gross_perday_formatted: 0,
        taxable_income_perday_formatted: 0,
        tax_perday_formatted: 0,
        netsalary_perday_formatted: 0,
      });        
    }
  });
});

/* GET payroll report page. */
router.get('/payroll-report', function(req, res, next) {
  res.render('payroll-report', { title: 'Payroll Report' });
});

/* GET loans granted page. */
router.get('/loans-granted', function(req, res, next) {
  res.render('loans-granted', { title: 'Loans Granted' });
});

/* GET grant loans page. */
router.get('/grant-loans', function(req, res, next) {
  res.render('grant-loans', { title: 'Grant Loans' });
});

/* GET employees page. */
router.get('/employees', function(req, res, next) {
  var sql = 'SELECT * FROM employees_enrolled'
  connection.query(sql, (err, rs) =>{
    res.render('employees', {
      title: 'Employees' ,
      empInfo: rs
    }
    );
  })
});

/* GET enroll page. */
router.get('/enroll',function(req, res, next) {
  res.render('enroll', {title: 'Enroll'});
});
router.post('/enroll', (req, res) =>{
  let Staff_ID = req.body.staffid;
  let First_Name = req.body.firstName;
  let Last_Name = req.body.lastName;
  let Email = req.body.email;
  let Date_Of_Birth = req.body.dob;
  let Phone_Number = req.body.phoneNumber;
  let Dept = req.body.dept;
  let Unit = req.body.unit;
  let Position = req.body.position;
  let Grade = req.body.grade;
  let Enroll_Date = req.body.enrollDate;
  let State = req.body.state;
  let City = req.body.city;
  let Street = req.body.street;
  let sql = `INSERT INTO  employees_enrolled(staff_id, first_name, last_name, email, date_of_birth,
  phone_number, department, unit, position, grade, enrollment_date, salary, state, city, street, qrcode) 
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  qrcode.toFile(Email+".png",Email)
  qrcode.toDataURL(Email, (err, qr) =>{
    let QRcode = qr
    if(Position === "1"){
      if(Grade === "1"){
        var Salary = 20000
      }
      else if(Grade === "2") {
        var Salary = 25000
      } 
      else if(Grade === "3"){
        var Salary = 30000
      }
    }
    else if(Position === "2"){
      if(Grade === "1"){
        var Salary = 500000
      }
      else if(Grade === "2") {
        var Salary = 700000
      } 
      else if(Grade === "3"){
        var Salary = 800000
      }
    }
    else if(Position === "3"){
      if(Grade === "1"){
        var Salary = 1700000
      }
      else if(Grade === "2") {
        var Salary = 3500000
      } 
      else if(Grade === "3"){
        var Salary = 5000000
      }
    }
    connection.query(sql,[Staff_ID,First_Name,Last_Name,Email,Date_Of_Birth,Phone_Number,Dept,Unit,Position,Grade,Enroll_Date,Salary,State,City,Street,QRcode], (err, rs) =>{
      if(err) throw err;
      res.redirect('/employees')
    })
  })
})

module.exports = router;