'use strict';
/**
 * app.js
 *
 * @des simple user center server
 * @author SimMan (liwei0990#gmail.com)
 * Created at 2016-05-26.
 * Copyright 2011-2016 Touna.cn, Inc.
 */

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var JsonDB = require('node-json-db');
var uuid = require('uuid');
var cookieParser = require('cookie-parser');
var deleteKey = require('key-del')
var session = require('express-session')
var moment = require('moment');
var cors = require('cors');

var app = express();
var db = new JsonDB("db", true, false);

// 引入 cors 解决跨域问题
app.use(cors());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: 'e208ab121d17a0d0a68e3ac234ffd156',
  cookie: {
    maxAge: 60 * 1000 * 120
  },
  resave: true,
  saveUninitialized: true,
}));

/**
 * 首页
 * @param  {[type]} req  [description]
 * @param  {[type]} res) {             res.send('Hello World!');} [description]
 * @return {[type]}      [description]
 */
app.get('/', function(req, res) {
  console.log(req.session);
  res.send('Hello World!');
});

/**
 * 登陆
 * @param  {[type]} req  [description]
 * @param  {[type]} res) {}          [description]
 * @return {[type]}      [description]
 */
app.post('/login', function(req, res) {
  var userName = req.body.userName;
  var userPwd = req.body.userPwd;

  if (!userName || !userPwd) {
    res.json({
      status: 400,
      message: '用户名、密码为空!'
    });
    return;
  }

  try {
    var userInfo = db.getData('/userList/' + userName);

    if (userPwd === userInfo.userPwd) {

      var outInfo = deleteKey(userInfo, 'userPwd');
      req.session.userInfo = outInfo;

      res.json({
        status: 200,
        message: '登陆成功!',
        data: outInfo
      });
      return;
    }
  } catch (error) {
    console.warn(error);
  }
  res.json({
    status: 402,
    message: '用户不存在!',
    data: null
  });
});

/**
 * 注册
 * @param  {[type]} req  [description]
 * @param  {[type]} res) {}          [description]
 * @return {[type]}      [description]
 */
app.post('/register', function(req, res) {
  var userName = req.body.userName;
  var userPwd = req.body.userPwd;

  if (!userName || !userPwd) {
    res.json({
      status: 400,
      message: '用户名、密码为空!'
    });
    return;
  }

  try {
    var userInfo = db.getData('/userList/' + userName);
    res.json({
      status: 401,
      message: '用户名已经存在!',
      data: null
    });
  } catch (error) {

    var userInfo = {
      userId: uuid.v1(),
      userName: userName,
      userPwd: userPwd,
      avatar: 'https://randomuser.me/api/portraits/men/' + Math.ceil(Math.random() * 50) + '.jpg'
    }

    db.push('/userList/' + userName, userInfo);

    var outInfo = deleteKey(userInfo, 'userPwd');
    req.session.userInfo = outInfo;

    res.json({
      status: 200,
      message: '注册成功!',
      data: outInfo
    });
  }

});

/**
 * 退出登陆
 * @param  {[type]} req  [description]
 * @param  {[type]} res) {}          [description]
 * @return {[type]}      [description]
 */
app.post('/logout', function(req, res) {

  req.session = null;

  res.json({
    status: 200,
    message: '注销成功!'
  });
});

/**
 * twitters
 * @param  {[type]} ) {             try {    var twitters [description]
 * @return {[type]}   [description]
 */
app.get('/twitters', function() {
  try {
    var twitters = db.getData('/twitters/');

    res.json({
      status: 200,
      message: 'ok!',
      data: twitters
    });

  } catch (error) {

  }

  res.json({
    status: 404,
    message: '没有找到数据!'
  });
})

app.post('/putTwitter', function(req, res) {

  var tw = req.body.twitter;

  if (!req.session.userInfo) {
    res.json({
      status: 401,
      message: '请先进行登陆!!!'
    });
    return;
  }

  if (!tw) {
    res.json({
      status: 405,
      message: '请输入推文内容!'
    });
    return;
  }

  var newTwitter = {
    'content': tw,
    'createDate': moment().format(),
    'auth': req.session.userInfo.userName,
    'avatar': req.session.userInfo.avatar,
    'tid': uuid.v4()
  };

  db.push("/twitters[]", newTwitter, true);

  res.json({
    status: 200,
    message: 'ok!',
    data: newTwitter
  });
});

app.listen(8087, function() {
  console.log('simple user center app listening on port 8087!');
});
