// Confere a criptografia com o lado do navegador (decifra o que o servidor cifrou) e o token VAPID.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { encryptPayload, generateVapidKeys, vapidHeader, b64url, fromB64url } from './webpush.mjs';

test('aes128gcm: o aparelho consegue decifrar', () => {
  const ua = crypto.createECDH('prime256v1');
  ua.generateKeys();
  const auth = crypto.randomBytes(16);
  const msg = JSON.stringify({ title: 'Academia', body: 'Aula de spinning em 1 hora' });
  const out = encryptPayload(msg, b64url(ua.getPublicKey()), b64url(auth));
  // lado do navegador
  const salt = out.subarray(0, 16);
  const rs = out.readUInt32BE(16);
  const idlen = out[20];
  const asPublic = out.subarray(21, 21 + idlen);
  const ct = out.subarray(21 + idlen);
  assert.equal(rs, 4096);
  const shared = ua.computeSecret(asPublic);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPublic]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', shared, auth, info, 32));
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2);
  assert.equal(plain.subarray(0, -1).toString(), msg);
});

test('VAPID: assinatura ES256 válida com a chave pública', () => {
  const keys = generateVapidKeys();
  assert.equal(fromB64url(keys.publicKey).length, 65);
  const h = vapidHeader('https://fcm.googleapis.com/fcm/send/abc', keys, 'mailto:x@y.z');
  const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(h);
  assert.ok(m);
  const payload = JSON.parse(fromB64url(m[2]).toString());
  assert.equal(payload.aud, 'https://fcm.googleapis.com');
  const raw = fromB64url(m[4]);
  const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64url(raw.subarray(1, 33)), y: b64url(raw.subarray(33)) }, format: 'jwk' });
  const ok = crypto.verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: pub, dsaEncoding: 'ieee-p1363' }, fromB64url(m[3]));
  assert.ok(ok);
});

test('RFC 8291, apêndice A: resultado idêntico ao vetor oficial', () => {
  const as = crypto.createECDH('prime256v1');
  as.setPrivateKey(fromB64url('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'));
  const out = encryptPayload(
    'When I grow up, I want to be a watermelon',
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    'BTBZMqHH6r4Tts7J_aSIgg',
    { salt: fromB64url('DGv6ra1nlYgDCS1FRnbzlw'), ecdh: as }
  );
  assert.equal(
    b64url(out),
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN'
  );
});

test('envio completo: serviço de push recebe mensagem que o aparelho decifra', async () => {
  const http = await import('node:http');
  const { sendPush } = await import('./webpush.mjs');
  const ua = crypto.createECDH('prime256v1');
  ua.generateKeys();
  const auth = crypto.randomBytes(16);
  let got;
  const srv = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      got = { headers: req.headers, body: Buffer.concat(chunks) };
      res.writeHead(201).end();
    });
  });
  await new Promise((r) => srv.listen(0, r));
  const endpoint = `http://127.0.0.1:${srv.address().port}/push/abc`;
  const keys = generateVapidKeys();
  const r = await sendPush({ endpoint, keys: { p256dh: b64url(ua.getPublicKey()), auth: b64url(auth) } }, { title: 'Oi', body: 'Teste' }, keys);
  srv.close();
  assert.equal(r, 'ok');
  assert.equal(got.headers['content-encoding'], 'aes128gcm');
  assert.match(got.headers.authorization, /^vapid t=.+, k=/);
  const out = got.body;
  const salt = out.subarray(0, 16), idlen = out[20], asPublic = out.subarray(21, 21 + idlen), ct = out.subarray(21 + idlen);
  const shared = ua.computeSecret(asPublic);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', shared, auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPublic]), 32));
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, -16)), d.final()]).subarray(0, -1);
  assert.deepEqual(JSON.parse(plain.toString()), { title: 'Oi', body: 'Teste' });
});

test('aparelho que saiu (410) é marcado para remoção', async () => {
  const http = await import('node:http');
  const { sendPush } = await import('./webpush.mjs');
  const ua = crypto.createECDH('prime256v1');
  ua.generateKeys();
  const srv = http.createServer((req, res) => req.on('data', () => {}).on('end', () => res.writeHead(410).end()));
  await new Promise((r) => srv.listen(0, r));
  const r = await sendPush(
    { endpoint: `http://127.0.0.1:${srv.address().port}/x`, keys: { p256dh: b64url(ua.getPublicKey()), auth: b64url(crypto.randomBytes(16)) } },
    { title: 'x' },
    generateVapidKeys()
  );
  srv.close();
  assert.equal(r, 'gone');
});
