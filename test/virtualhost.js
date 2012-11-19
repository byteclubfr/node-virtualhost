
// Dependencies
var http = require('http');
var express = require('express');
var expect = require('chai').expect;
var request = require('supertest');
var virtualhost = require('..');

// Sample server
var port = 43434;
var servers = {
  "handler1.domain.tld": function handler1 (req, res) { res.end('handler1 (name=' + req.virtualhost.name + ')'); },
  "handler2_fail": {
    pattern: "handler2.domain.tld",
    with_port: true,
    handler: function handler2 (req, res) { res.end('handler2'); }
  },
  "handler2_ok": {
    pattern: "handler2.domain.tld:" + port,
    with_port: true,
    handler: function handler2 (req, res) { res.end('handler2, hostname = ' + req.virtualhost.hostname); }
  },
  "handler3_express": {
    pattern: /^(handler3|express)\.domain\.tld$/,
    handler: express().get('/hello/:who', function (req, res) { res.end('Hello from ' + req.virtualhost.match[1] + ', ' + req.param('who')); })
  }
};
var handler = virtualhost(servers);

// Tests
describe('Virtualhost', function () {

  describe('Configuration', function () {
    it('should require callback as catchAll', function () {
      expect(virtualhost.bind(null, {}, 'not a callback')).to.throw(/Catch-all should be a valid callback/i);
    });
    it('should require "pattern"', function () {
      expect(virtualhost.bind(null, {server: {handler: function(){}}})).to.throw(/"server": "pattern" should be/);
      expect(virtualhost.bind(null, {server: {pattern: "a.stri.ng", handler: function(){}}})).to.not.throw();
      expect(virtualhost.bind(null, {server: {pattern: /^a\.rege\.xp$/, handler: function(){}}})).to.not.throw();
    });
    it('should require "handler"', function () {
      expect(virtualhost.bind(null, {server: {pattern: "a.stri.ng"}})).to.throw(/"server": "handler" should be/);
      expect(virtualhost.bind(null, {server: {pattern: "a.stri.ng", handler: 'not a callback'}})).to.throw(/"server": "handler" should be/);
    });
  });

  it('should return a valid HTTP handler', function () {
    expect(handler).to.be.a('function');
    expect(handler).to.have.length(2);
  });

  it('should match handler1.domain.tld', function (done) {
    request(handler)
      .get('/')
      .set('Host', 'handler1.domain.tld')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.text).to.equal('handler1 (name=handler1.domain.tld)');
        done();
      });
  });

  it('should not match handler2.domain.tld', function (done) {
    request(handler)
      .get('/')
      .set('Host', 'handler2.domain.tld')
      .expect(404)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.text).to.equal('Invalid host name');
        done();
      });
  });

  it('should match handler2.domain.tld:' + port, function (done) {
    request(handler)
      .get('/')
      .set('Host', 'handler2.domain.tld:' + port)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.text).to.equal('handler2, hostname = handler2.domain.tld');
        done();
      });
  });

  it('should match express.domain.tld', function (done) {
    request(handler)
      .get('/hello/world')
      .set('Host', 'express.domain.tld')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.text).to.equal('Hello from express, world');
        done();
      });
  });

  it('should match handler3.domain.tld', function (done) {
    request(handler)
      .get('/hello/world')
      .set('Host', 'handler3.domain.tld')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.text).to.equal('Hello from handler3, world');
        done();
      });
  });

});
