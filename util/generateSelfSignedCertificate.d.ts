declare namespace generateKeyPair {
    type Return = string|Buffer;
}

/**
 * For using it you need openssl installed and accessible in $PATH
 *
 * It will generate some files with openssl commands :
 * ```js
 * `openssl genrsa -out ${paths.privateKey} ${2**12}`
 * `openssl req -new -sha256 -key ${paths.privateKey} -out ${paths.publicKey} -subj '${subj}'`
 * `openssl x509 -req -in ${paths.publicKey} -signkey ${paths.privateKey} -out ${paths.certificate}`
 * ```
 *
 * `paths.*` are temporary files, generated in your system temp folder
 * `subj` is `/C=EN/ST=London/L=London/O=Global Security/OU=IT Department/CN=localhost`
 * total random info found on first page on internet for avoid openssl prompt when `req -new`
 *
 * whnen privateKey and certificate are generated. read, store in memory, and remove from disk
 *
 * and return content of files
 */
declare function generateKeyPair(): Promise<{privateKey: generateKeyPair.Return, certificate: generateKeyPair.Return}>
export = generateKeyPair;