/* eslint-disable no-console */

import axios from 'axios';
import { writeFile } from 'node:fs';
import semver from 'semver';

const windowsOpts = {
  operatingSystem: 'windows',
  archiveTypes: ['exe', 'tar.gz', 'zip'],
  architectures: ['amd64', 'x86'],
};

const macOpts = {
  operatingSystem: 'macos',
  archiveTypes: ['dmg', 'zip', 'tar.gz'],
  architectures: ['amd64', 'arm64'],
};

const linuxOpts = {
  operatingSystem: 'linux',
  archiveTypes: ['zip', 'tar.gz'],
  architectures: ['amd64', 'x86', 'arm', 'arm64'],
};

const index = {
  windows: {},
  linux: {},
  darwin: {},
};

async function fetchPackages(pkgOptions) {
  let architecture = '';
  pkgOptions.architectures.forEach((arch) => {
    architecture += `&architecture=${arch}`;
  });
  let archiveType = '';
  pkgOptions.archiveTypes.forEach((type) => {
    archiveType += `&archive_type=${type}`;
  });
  const url = `https://api.foojay.io/disco/v3.0/packages/jdks?operating_system=${pkgOptions.operatingSystem}${architecture}&javafx_bundled=false${archiveType}`;
  return axios({
    url,
    method: 'get',
  }).then((response) => response.data.result);
}

function mapOS(os) {
  if (os === 'macos') {
    return 'darwin';
  }
  return os;
}

function mapArchitecture(os, architecture) {
  if (architecture === 'x64') {
    return 'amd64';
  }
  if (architecture === 'x86') {
    return '386';
  }
  if (architecture === 'aarch64') {
    return 'arm64';
  }
  return architecture;
}

function mapArchiveType(archiveType) {
  switch (archiveType) {
    case 'tar.gz':
      return 'tgz+';
    case 'zip':
      return 'zip+';
    case 'dmg':
      return 'dmg+';
    case 'exe':
      return 'exe+';
    default:
      return '';
  }
}

function mapVersion(javaVersion) {
  const [version] = javaVersion.split('+');
  const semvers = version.split('.');
  let versionOut = `${semvers[0]}`;
  if (semvers[1]) {
    versionOut += `.${semvers[1]}`;
  }
  if (semvers[2]) {
    versionOut += `.${semvers[2]}`;
  }
  if (semvers[3]) {
    versionOut += `-${semvers[3]}`;
  }
  return versionOut;
}

function mapLegacyVersion(jdk) {
  const [version, plusVersion] = jdk.java_version.split('+');
  const semvers = version.split('.');
  if (!/^graalvm_/.test(jdk.distribution)) {
    semvers.unshift('1');
    while (semvers.length < 3) {
      semvers.push('0');
    }
    if (version.indexOf('.') === -1 && !/^oracle/.test(jdk.distribution) &&
      (plusVersion !== undefined || jdk.distribution !== 'zulu')) {
      semvers.push('0');
    }
    if (jdk.distribution === 'corretto') {
      const correttoRest = jdk.distribution_version.split('.').slice(3).join('.');
      if (correttoRest.length) {
        semvers[semvers.length - 1] += `.${correttoRest}`;
      }
    } else if (jdk.distribution === 'liberica' || jdk.distribution === 'zulu') {
      if (semvers[1] === '8') {
        semvers.splice(2, 1);

        if (jdk.distribution !== 'zulu') {
          semvers.push(plusVersion);
        }
      }
    }
  } else {
    while (semvers.length < 3) {
      semvers.push('0');
    }
  }
  let versionOut = `${semvers[0]}`;
  if (semvers[1]) {
    versionOut += `.${semvers[1]}`;
  }
  if (semvers[2]) {
    versionOut += `.${semvers[2]}`;
  }
  if (semvers[3]) {
    versionOut += `-${semvers[3]}`;
  }
  return versionOut;
}

function mapLegacyDistribution(distribution) {
  switch (distribution) {
    case 'oracle_open_jdk':
      return 'openjdk';
    case 'graalvm_ce8':
      return 'graalvm-ce-java8';
    case 'graalvm_ce19':
      return 'graalvm-ce-java19';
    case 'graalvm_ce17':
      return 'graalvm-ce-java17';
    case 'graalvm_ce16':
      return 'graalvm-ce-java16';
    case 'graalvm_ce11':
      return 'graalvm-ce-java11';
    case 'corretto':
      return 'amazon-corretto';
    case 'aoj_openj9':
      return 'adopt-openj9';
    case 'aoj':
      return 'adopt';
    case 'oracle':
      return '';
    default:
      return null;
  }
}

function parsePackages(packageList) {
  packageList.forEach((jdkPkg) => {
    const operatingSystem = mapOS(jdkPkg.operating_system);
    const architecture = mapArchitecture(jdkPkg.operating_system, jdkPkg.architecture);
    const link = jdkPkg.links.pkg_download_redirect;
    if (!index[operatingSystem]) {
      index[operatingSystem] = {};
    }

    const version = mapVersion(jdkPkg.java_version);
    const type = mapArchiveType(jdkPkg.archive_type);

    if (!index[operatingSystem][architecture]) {
      index[operatingSystem][architecture] = {};
    }

    if (!index[operatingSystem][architecture][`jdk@${jdkPkg.distribution}`]) {
      index[operatingSystem][architecture][`jdk@${jdkPkg.distribution}`] = {};
    }
    const jdkDist = index[operatingSystem][architecture][`jdk@${jdkPkg.distribution}`];
    const jdkLink = `${type}${link}`;
    jdkDist[version] = jdkLink;

    const legacyVersion = mapLegacyVersion(jdkPkg);
    if (legacyVersion !== version) {
      jdkDist[legacyVersion] = jdkLink;
    }

    let legacyJdk = mapLegacyDistribution(jdkPkg.distribution);
    if (legacyJdk !== null) {
      if (legacyJdk !== '') {
        legacyJdk = `@${legacyJdk}`;
      }

      if (!index[operatingSystem][architecture][`jdk${legacyJdk}`]) {
        index[operatingSystem][architecture][`jdk${legacyJdk}`] = jdkDist;
      }
    }

    if (/^graalvm/.test(jdkPkg.distribution)) {
      if (!index[operatingSystem][architecture]['jdk@graalvm']) {
        index[operatingSystem][architecture]['jdk@graalvm'] = {};
      }

      index[operatingSystem][architecture]['jdk@graalvm'][legacyVersion] = jdkLink;
    }
  });
}

parsePackages(await fetchPackages(windowsOpts));
parsePackages(await fetchPackages(macOpts));
parsePackages(await fetchPackages(linuxOpts));

// sort the index by version for each os, arch, jdk
Object.keys(index).forEach((os) => {
  Object.keys(index[os]).forEach((architecture) => {
    Object.keys(index[os][architecture]).forEach((jdk) => {
      const orderedJdk = Object.keys(index[os][architecture][jdk])
        .sort(
          (a, b) => {
            let [verA, verB] = [a, b];
            for (let i = (a.match(/\./g) || []).length; i < 2; ++i) {
              verA += '.0';
            }
            for (let i = (b.match(/\./g) || []).length; i < 2; ++i) {
              verB += '.0';
            }

            return semver.compare(verA, verB);
          },
        )
        .reverse()
        .reduce(
          (obj, version) => {
            const myObj = obj;
            myObj[version] = index[os][architecture][jdk][version];
            return myObj;
          },
          {},
        );
      index[os][architecture][jdk] = orderedJdk;
    });
  });
});

writeFile('index.json', `${JSON.stringify(index, null, 4)}\n`, (err) => {
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
