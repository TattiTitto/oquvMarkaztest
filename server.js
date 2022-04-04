const express = require('express');
const bodyParser = require('body-parser');
const { client } = require('./public/js/database');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
dotenv.config();

const app = express()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'))
app.use(express.json())
app.use('/css', express.static(__dirname + '/public/css'))
app.use('/js', express.static(__dirname + '/public/js'))

app.set('view engine', 'ejs');
app.set('layout', './layouts/layout')
app.use(expressLayouts)

app.get('', (req, res) => res.render('index', { title: "Home"}));

app.get("/teacher", (req, res) => teacher(req, res))
app.post("/teacher", urlencodedParser, (req, res) => {
    if(req.body.add == 'subject')
        client.query(`SELECT * FROM teachers`, (err1, res1) => 
        client.query(`SELECT * FROM subjects`, (err2, res2) => {
            for (let i = 0; i < res1.rowCount; i++)
                if(res1.rows[i].name == req.body.teacher)
                    for (let j = 0; j < res2.rowCount; j++)
                        if(res2.rows[j].name == req.body.subject)
                            client.query(`INSERT INTO con_teacher_subject VALUES(${res1.rows[i].id}, ${res2.rows[j].id})`, (err3, res3) => {})}))
    else if(req.body.add == 'teacher') client.query(`INSERT INTO teachers (name, surname, number, gender, lessoncount) VALUES('${req.body.name}', '${req.body.surname}', ${req.body.number}, ${req.body.gender}, 0)`, (err, res1) => {})
    else if(req.body.remove == 'teachers') {
        client.query(`DELETE FROM con_teacher_subject WHERE teacher_id=${req.body.id}`, (err0, res0) => {})
        client.query(`DELETE FROM con_group_student WHERE group_id in(SELECT id FROM groups WHERE teacher_id=${req.body.id})`, (err0, res0) => {console.log(err0);})
        client.query(`DELETE FROM groups WHERE teacher_id=${req.body.id}`, (err0, res0) => {})
        client.query(`DELETE FROM teachers WHERE id=${req.body.id}`, (err0, res0) => {})
    } else if (req.body.remove == 'groups') {
        console.log(req.body);
        client.query(`DELETE FROM con_group_student WHERE group_id=${req.body.id}`, (err0, res0) => {})
        client.query(`DELETE FROM groups WHERE id=${req.body.id}`, (err0, res0) => {})
    }
    else {
        client.query(`DELETE FROM con_teacher_subject WHERE teacher_id=${req.body.conid}`, (err0, res0) => {})
        client.query(`DELETE FROM con_group_student WHERE group_id=${req.body.id}`, (err0, res0) => {})
        client.query(`DELETE FROM groups WHERE id=${req.body.id}`, (err0, res0) => {})
    }
    teacher(req, res)
})

app.get("/group", (req, res) => group(req, res))
app.post("/group", urlencodedParser, (req, res) => {
    if(req.body.add == 'group')
        client.query(`SELECT * FROM teachers`, (err1, res1) => 
            client.query(`SELECT * FROM subjects`, (err2, res2) => {
                for (let i = 0; i < res1.rowCount; i++)
                    if(res1.rows[i].name == req.body.teacher)
                        for (let j = 0; j < res2.rowCount; j++)
                            if(res2.rows[j].name == req.body.subject)
                                client.query(`INSERT INTO groups (name, teacher_id, subject_id, day) VALUES('${req.body.name}', ${res1.rows[i].id}, ${res2.rows[j].id}, '0')`, (err3, res3) => {})
            }
        ))
    else if(req.body.add == 'student') {
        client.query(`SELECT * FROM groups`, (err1, res1) => {
            console.log(req.body);
            for (let i = 0; i < res1.rowCount; i++)
                if(res1.rows[i].name == req.body.group)
                    client.query(`INSERT INTO con_group_student VALUES(${res1.rows[i].id}, ${req.body.student}, '0')`, (err2, res2) => {console.log("------"+err2);})
        })
    } else if(req.body.remove == 'groups') client.query(`DELETE FROM groups WHERE id=${req.body.id}`, (err0, res0) => {console.log(err0);})
    else if(req.body.remove == 'students') client.query(`DELETE FROM con_group_student WHERE group_id=${req.body.conid} and student_id=${req.body.id}`, (err0, res0) => {console.log(err0);})
    group(req, res)
})

app.get('/student', (req, res) => {
    student(req, res)
})
app.post('/student', urlencodedParser, (req, res) => {
    if(req.body.remove == 'students') {
        client.query(`DELETE FROM con_group_student WHERE student_id=${req.body.id}`, (err1, res1) => {})
        client.query(`DELETE FROM students WHERE id=${req.body.id}`, (err1, res1) => {})
    } else if(req.body.add == 'student') {
        client.query(`DELETE FROM con_group_student WHERE student_id=${req.body.id}`, (err1, res1) => {})
        client.query(`DELETE FROM students WHERE id=${req.body.id}`, (err1, res1) => {})
    } else {
        client.query(`INSERT INTO students (name, surname, number, gender, lessoncount) VALUES('${req.body.name}', '${req.body.surname}', ${req.body.number}, ${req.body.gender}, 0)`, (err, res1) =>{console.log(err);})
    }
    console.log(req.body);
    student(req, res)
})

app.get('/subject', (req, res) => client.query(`SELECT * FROM subjects`, (err1, res1) => res.render('subject', { title: "Subjects", subjects: res1.rows })))
app.post('/subject', urlencodedParser, (req, res) => {
    if(req.body.remove == 'subjects') {
        client.query(`DELETE FROM con_teacher_subject WHERE subject_id=${req.body.id}`, (err0, res0) => {console.log(err0);})
        client.query(`DELETE FROM groups WHERE subject_id=${req.body.id}`, (err0, res0) => {console.log(err0);})
        client.query(`DELETE FROM subjects WHERE id=${req.body.id}`, (err0, res0) => {console.log(err0);})
    } else client.query(`INSERT INTO subjects (name) VALUES('${req.body.name}')`, (err1, res1) => {})
    client.query(`SELECT * FROM subjects`, (err2, res2) => res.render('subject', { title: "Subjects", subjects: res2.rows }))
})

app.get('/schedule', (req, res) => schedule(req, res))
app.post('/schedule', urlencodedParser, (req, res) => {
    if(req.body.add == 'group') {
        client.query(`SELECT * FROM groups WHERE name='${req.body.group}'`, (err1, res1) => client.query(`INSERT INTO schedule (group_id, day_id) VALUES (${res1.rows[0].id}, ${req.body.day_id})`, (err2, res2) => {}))
    } else if(req.body.remove == 'groups') {
        client.query(`DELETE FROM schedule WHERE group_id=${req.body.id} AND day_id=${req.body.conid}`, (err1, res1) => {})
    } else if (req.body[0].type == 'saveGroups') {
        for (let i = 1; i < req.body.length; i++) {
            client.query(`SELECT * FROM groups WHERE id=${req.body[i].group_id} AND day!='${new Date().toLocaleDateString()}'`, (err1, res1) => {
                console.log(req.body);
                if(res1.rowCount == 1 && req.body[i].checked){
                    console.log(111);
                    client.query(`SELECT * FROM teachers WHERE id=${res1.rows[0].teacher_id}`, (err2, res2) => {
                        client.query(`UPDATE teachers SET lessoncount=${res2.rows[0].lessoncount + 1} WHERE id=${res1.rows[0].teacher_id}`, (err3, res3) => {
                            client.query(`UPDATE groups SET day='${new Date().toLocaleDateString()}' WHERE id=${req.body[i].group_id}`, (err0, res0) => {
                            })
                        })
                    })
                }
            })
        }
    } else if (req.body[0].type == 'saveStudents') {
        for (let i = 1; i < req.body.length; i++) {
            client.query(`SELECT * FROM con_group_student WHERE group_id=${req.body[i].group_id} AND student_id=${req.body[i].student_id} AND day!='${new Date().toLocaleDateString()}'`, (err1, res1) => {
                if(res1.rowCount == 1 && req.body[i].checked){
                    client.query(`SELECT * FROM students WHERE id=${res1.rows[0].student_id}`, (err2, res2) => {
                        client.query(`UPDATE students SET lessoncount=${res2.rows[0].lessoncount + 1} WHERE id=${res1.rows[0].student_id}`, (err3, res3) => {
                            client.query(`UPDATE con_group_student SET day='${new Date().toLocaleDateString()}' WHERE group_id=${req.body[i].group_id} AND student_id=${req.body[i].student_id}`, (err0, res0) => {})
                        })
                    })
                }
            })
        }
    }
    schedule(req, res)
})

app.listen(process.env.PORT, () => console.log(`Server is listening ${process.env.PORT}`))

function teacher(req, res) {
    client.query(`SELECT * FROM teachers`, (err1, res1) => 
    client.query(`SELECT * FROM groups`, (err2, res2) => 
    client.query(`SELECT * FROM students`, (err3, res3) => 
    client.query(`SELECT * FROM subjects`, (err4, res4) => 
    client.query(`SELECT * FROM con_teacher_subject`, (err5, res5) => 
        res.render('teacher', { title: "Teachers", teachers: res1.rows, groups: res2.rows, students: res3.rows, subjects: res4.rows, conTS: res5.rows }))))))
}

function group(req, res) {
    client.query(`SELECT * FROM teachers`, (err1, res1) => 
    client.query(`SELECT * FROM subjects`, (err2, res2) => 
    client.query(`SELECT * FROM con_teacher_subject`, (err3, res3) => 
    client.query(`SELECT * FROM groups`, (err4, res4) => 
    client.query(`SELECT * FROM con_group_student`, (err5, res5) => 
    client.query(`SELECT * FROM students`, (err6, res6) => 
        res.render('group', { title: "Groups", teachers: res1.rows, subjects: res2.rows, conTS: res3.rows, groups: res4.rows, conGS: res5.rows, students: res6.rows })))))))
}

function student(req, res) {
    client.query(`SELECT * FROM students`, (err1, res1) => 
    client.query(`SELECT * FROM subjects`, (err2, res2) => 
    client.query(`SELECT * FROM teachers`, (err3, res3) => 
    client.query(`SELECT * FROM con_teacher_subject`, (err4, res4) => 
    client.query(`SELECT * FROM groups`, (err5, res5) => 
    client.query(`SELECT * FROM con_group_student`, (err6, res6) => 
        res.render('student', { title: "Students", students: res1.rows, subjects: res2.rows, teachers: res3.rows, conTS: res4.rows, groups: res5.rows, conGS: res6.rows })))))))
}

function schedule(req, res) {
    client.query(`SELECT * FROM teachers`, (err1, res1) => 
    client.query(`SELECT * FROM subjects`, (err2, res2) => 
    client.query(`SELECT * FROM con_teacher_subject`, (err3, res3) => 
    client.query(`SELECT * FROM groups`, (err4, res4) => 
    client.query(`SELECT * FROM con_group_student`, (err5, res5) => 
    client.query(`SELECT * FROM students`, (err6, res6) => 
    client.query(`SELECT * FROM schedule`, (err7, res7) => 
        res.render('schedule', { title: "Schedule", teachers: res1.rows, subjects: res2.rows, conTS: res3.rows, groups: res4.rows, conGS: res5.rows, students: res6.rows, schedule: res7.rows }))))))))
}
