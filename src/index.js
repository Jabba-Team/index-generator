import axios from 'axios';
import { writeFile } from 'node:fs';

const windowsOpts = {
  operatingSystem: 'windows',
  archiveType:'zip',
  architectures: ['amd64', 'x86']
}

const macOpts = {
  operatingSystem: 'macos',
  archiveType:'tar.gz',
  architectures: ['amd64', 'arm64']
}

const linuxOpts = {
  operatingSystem: 'linux',
  archiveType:'tar.gz',
  architectures: ['amd64', 'x86', 'arm', 'arm64', 'aarch64']
}

const index = {
  windows: {

  },
  linux: {

  },
  darwin: {

  }
};



async function fetchPackages(pkgOptions) {
  let architecture = ''
  pkgOptions.architectures.forEach(arch => {
    architecture.concat(`&architecture=${arch}`);
  });
  const url = `https://api.foojay.io/disco/v3.0/packages/jdks?operating_system=${pkgOptions.operatingSystem}${architecture}&archive_type=${pkgOptions.archiveType}`;
  return await axios({
    url,
    method: 'get'
  }).then((response) => response.data.result)
}

function mapOS(os) {
  if(os === 'macos') {
    return 'darwin';
  }
  return os;
}

function mapArchitecture(architecture) {
  if(architecture === 'x64') {
    return 'amd64';
  }
  if(architecture === 'x86') {
    return '386'
  }
  return architecture;
}

function mapArchiveType(archiveType) {
  if(archiveType === 'tar.gz') {
    return 'tgz+';
  } else if (archiveType === 'zip') {
    return 'zip+';
  }
}

function mapVersion(java_version) {
  let version = java_version.split('+')[0];
  const semvers = version.split('.');
  version = `${semvers[0]}`;
  if(semvers[1]){
    version = `${version}.${semvers[1]}`
  }
  if(semvers[2]){
    version = `${version}.${semvers[2]}`
  }
  if(semvers[3]){
    version = `${version}-${semvers[3]}`
  }
  return version;
}

function parsePackages(packageList, archiveType) {
  archiveType = mapArchiveType(archiveType);
  packageList.forEach((jdkPkg) => {

    const operatingSystem = mapOS(jdkPkg.operating_system);
    const architecture = mapArchitecture(jdkPkg.architecture);
    const link = jdkPkg.links.pkg_download_redirect;
    if (!index[operatingSystem]) {
      index[operatingSystem] = {};
    }

    const version = mapVersion(jdkPkg.java_version);
  
    if (!index[operatingSystem][architecture]) {
      index[operatingSystem][architecture] = {};
    }

    if (!index[operatingSystem][architecture][`jdk@${jdkPkg.distribution}`]) {
      index[operatingSystem][architecture][`jdk@${jdkPkg.distribution}`] = {};
    }
    const jdkDist = index[operatingSystem][architecture][`jdk@${jdkPkg.distribution}`];
    jdkDist[version] = `${archiveType}${link}`;
  });
}

parsePackages(await fetchPackages(windowsOpts), windowsOpts.archiveType);
parsePackages(await fetchPackages(macOpts), macOpts.archiveType);
parsePackages(await fetchPackages(linuxOpts), linuxOpts.archiveType);


writeFile('index.json', JSON.stringify(index, null, 4), (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});

// build up an object that looks like this
/*
{
    "windows": {
        "amd64": {
            "zulu": {
                "18.0.1": "link"
            }
        }
    }
}
*/
