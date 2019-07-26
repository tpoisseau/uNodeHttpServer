import util from 'util';
import child_process from 'child_process';
import {promises as fs} from 'fs';
import path from 'path';
import os from 'os';

const exec = util.promisify(child_process.exec);

const PATHS = {
  privateKey: 'dev-private-key.pem',
  publicKey: 'dev-public-key.pem',
  certificate: 'dev-certificate.pem',
};

async function generatePaths() {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'u-http-server'));
  
  const entries = Object.entries(PATHS).map(([key, value]) => [key, path.join(folder, value)]);
  const paths = entries.reduce((o, [key, value]) => {
    o[key] = value;
    
    return o;
  }, {});
  
  return [folder, paths]
}

const subj = `/C=EN/ST=London/L=London/O=Global Security/OU=IT Department/CN=localhost`;

export default async function generateKeyPair() {
  const [folder, paths] = await generatePaths();
  
  // generate privateKey, Certificate Signing Request, and certificate
  await exec(`openssl genrsa -out ${paths.privateKey} ${2 ** 12}`);
  await exec(`openssl req -new -sha256 -key ${paths.privateKey} -out ${paths.publicKey} -subj '${subj}'`);
  await exec(`openssl x509 -req -in ${paths.publicKey} -signkey ${paths.privateKey} -out ${paths.certificate}`);
  
  // read privateKey and certificate
  const [privateKey, certificate] = await Promise.all([
    fs.readFile(paths.privateKey),
    fs.readFile(paths.certificate),
  ]);
  
  // remove generated files and temp folder
  await Promise.all(Object.values(paths).map(file => exec(`rm ${file}`)));
  await fs.rmdir(folder);
  
  return {privateKey, certificate};
}