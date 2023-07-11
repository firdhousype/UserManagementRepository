const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
let app = express();
let server = http.createServer(app);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("./db.js");
const format = require("./formatdate.js");
const nodemailer = require("nodemailer");

server.listen(3000, () => {
  console.log("Server listening on port: 3000");
});

// list all users --- GET Method
app.get("/user/", async (req, res) => {
  try {
    const sql = "select * from user";
    db.all(sql, (err, row) => {
      if (err) {
        return res.status(400).send("Error encountered while displaying");
      }
      console.log("users displayed successfully");
      return res.status(200).json({
        message: "users displayed successfully",
        status: row,
      });
    });
  } catch (err) {
    console.log(err);
  }
});
// list  user with page=0&count=10
app.get("/user", async (req, res) => {
  try {
    const sql = "select users from user LIMIT ? OFFSET ?";
    const params = [req.query.count, req.query.page];
    db.all(sql, params, (err, row) => {
      if (err) {
        return res.status(400).send("Error encountered while displaying");
      }
      console.log("user displayed successfully");
      return res.status(200).json({
        message: "users displayed successfully",
        status: row,
      });
    });
  } catch (err) {
    console.log(err);
  }
});
// list  user with id --- GET Method with id
app.get("/user/:id", async (req, res) => {
  try {
    const sql = "select * from user where id=?";
    const params = req.params.id;
    db.each(sql, params, (err, row) => {
      if (err) {
        return res.status(400).send("Error encountered while displaying");
      }
      console.log("user displayed successfully");
      return res.status(200).json({
        message: "user displayed successfully",
        status: row,
      });
    });
  } catch (err) {
    console.log(err);
  }
});
// add users -- POST Method
app.post("/user/", bodyParser.json(), async (req, res) => {
  try {
    const date = format(new Date());
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;
    if (!(first_name && last_name && email && password)) {
      console.log("All input is required");
      return res.status(400).send("All input is required");
    }
    const inserquery = `INSERT INTO user (first_name, last_name, email,password,salt,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`;
    const salt = bcrypt.genSaltSync(10);
    const params = [
      first_name,
      last_name,
      email,
      bcrypt.hashSync(password, salt),
      salt,
      date,
      "",
    ];
    db.run(inserquery, params, (err, row) => {
      if (err) {
        return res.status(400).send(err);
      }
      console.log("New user has been added");
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "your email id",
          pass: "your password",
        },
      });

      var mailOptions = {
        from: "your email id",
        to: email,
        subject: "Successfully Created Account",
        text: "Account is Registerd",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      return res.status(200).json({
        message: "New user has been added ",
        Name: first_name + last_name,
      });
    });
  } catch (err) {
    console.log(err);
  }
});
//update user --- UPDATE Method
app.put("/user/:id", bodyParser.json(), async (req, res) => {
  try {
    const date = format(new Date());
    const id = req.params.id;

    const sql = "select * from user where id=?";
    db.each(sql, id, (err, rows) => {
      if (err) {
        return res.status(400).send("Error ");
      }
      let first_name, last_name, email, password;
      if (req?.body?.first_name) {
        first_name = req.body?.first_name;
      } else {
        first_name = rows["first_name"];
      }
      if (req?.body?.last_name) {
        last_name = req.body?.last_name;
      } else {
        last_name = rows["last_name"];
      }
      if (req?.body?.email) {
        email = req.body?.email;
      } else {
        email = rows["email"];
      }
      if (req?.body?.password) {
        password = req.body?.password;
      } else {
        password = rows["password"];
      }
      const updatequery = `UPDATE user set first_name = ?, last_name = ?, email = ? ,password = ? ,salt = ?,created_at = ? ,updated_at = ?  WHERE id = ?`;
      const salt = bcrypt.genSaltSync(10);
      const params = [
        first_name,
        last_name,
        email,
        bcrypt.hashSync(password, salt),
        salt,
        rows["created_at"],
        date,
        id,
      ];
      db.run(updatequery, params, (err, row) => {
        if (err) {
          return res.status(400).send("Error encountered while updating");
        }
        console.log("user updated successfully");
        return res.status(200).json({
          message: "user updated successfully",
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
});
// delete  user with id --- DELETE Method with id
app.delete("/user/:id", async (req, res) => {
  try {
    const deletequery = `DELETE FROM user WHERE id = ?`;
    const params = req.params.id;
    db.run(deletequery, params, (err, row) => {
      if (err) {
        res.status(400).send("Error encountered while deleting");
        return console.error(err.message);
      }
      console.log("user deleted successfully");
      return res.status(200).json({
        message: "user deleted successfully",
      });
    });
  } catch (err) {
    console.log(err);
  }
});
// Login  user --- POST Method

app.post("/login", bodyParser.json(), async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    let user = [];
    const sql = "select * from user where email=? ";

    db.all(sql, email, (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      rows.forEach(function (row) {
        user.push(row);
      });
      console.log("user....", user);
      const password_hash = bcrypt.hashSync(password, user[0].salt);

      if (password_hash === user[0].password) {
        // * CREATE JWT TOKEN
        const token = jwt.sign({ id: user[0].id, email }, "Secret 123", {
          expiresIn: "1h",
        });
        user[0].token = token;
      } else {
        return res.status(400).json({ message: "Incorrect Password" });
      }
      return res
        .status(200)
        .json({ message: "Sign In Successfully", status: user });
    });
  } catch (err) {
    console.log(err);
  }
});
