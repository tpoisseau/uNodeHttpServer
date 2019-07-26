import util from 'util';
import child_process from 'child_process';
import fs from 'fs';

const exec = util.promisify(child_process.exec);
const readFile = util.promisify(fs.readFile);

const paths = {
  privateKey: 'dev-private-key.pem',
  publicKey: 'dev-public-key.pem',
  certificate: 'dev-certificate.pem',
};

const subj = `/C=EN/ST=London/L=London/O=Global Security/OU=IT Department/CN=localhost`;

export default async function generateKeyPair() {
  await exec(`openssl genrsa -out ${paths.privateKey} ${2**12}`);
  await exec(`openssl req -new -sha256 -key ${paths.privateKey} -out ${paths.publicKey} -subj '${subj}'`);
  await exec(`openssl x509 -req -in ${paths.publicKey} -signkey ${paths.privateKey} -out ${paths.certificate}`);

  const files = await Promise.all([
    readFile(paths.privateKey),
    readFile(paths.certificate),
  ]);

  await Promise.all(Object.values(paths).map(file => exec(`rm ${file}`)));

  return files;
}