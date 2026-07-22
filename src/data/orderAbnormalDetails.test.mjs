import assert from 'node:assert/strict';
import test from 'node:test';
import { orders } from './mockData.js';

const categories = ['地址异常', '缺货', '物流延误', '平台同步失败', '支付异常', '退款', '清关异常', '发票异常'];

test('every order keeps an abnormal category and adds a concrete abnormal detail', () => {
  assert.equal(orders.length, 128);
  orders.forEach((order) => {
    assert.ok(categories.includes(order.abnormalType), `${order.id} should keep a supported category`);
    assert.ok(order.abnormalDetail, `${order.id} should have a concrete abnormal detail`);
    assert.notEqual(order.abnormalDetail, order.abnormalType, `${order.id} detail should be more specific than its category`);
  });
});

test('each abnormal category contains varied concrete business issues', () => {
  categories.forEach((category) => {
    const details = new Set(
      orders.filter((order) => order.abnormalType === category).map((order) => order.abnormalDetail),
    );
    assert.ok(details.size >= 4, `${category} should expose at least four concrete issues`);
  });
});

test('address exceptions cover the requested customer input problems', () => {
  const addressDetails = new Set(
    orders.filter((order) => order.abnormalType === '地址异常').map((order) => order.abnormalDetail),
  );
  ['收货地址拼写错误', '邮编与城市不匹配', '缺少楼栋或门牌号', '收件人姓名疑似不实'].forEach((detail) => {
    assert.ok(addressDetails.has(detail), `address details should include ${detail}`);
  });
});
