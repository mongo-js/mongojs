var shell = require('shelljs')

if (exec('git status --porcelain').stdout) {
  console.error('Git working directory not clean. Please commit all chances to release a new package to npm.')
  process.exit(2)
}

var versionIncrement = process.argv[process.argv.length - 1]
var versionIncrements = ['major', 'minor', 'patch']

if (versionIncrements.indexOf(versionIncrement) < 0) {
  console.error('Usage: node release.js major|minor|patch')
  process.exit(1)
}

exec('npm test')

var geotag = execOptional('npm run geotag')

if (geotag.code === 0) {
  exec('git commit -m "Geotag package for release" package.json')
}

exec('npm version ' + versionIncrement)

exec('git push')
exec('git push --tags')
exec('npm publish')

function exec (cmd) {
  var ret = shell.exec(cmd, { silent: true })

  if (ret.code !== 0) {
    console.error(ret.stdout)
    process.exit(1)
  }

  return ret
}

function execOptional (cmd) {
  var ret = shell.exec(cmd, { silent: true })

  if (ret.code !== 0) {
    console.log(ret.stdout)
  }

  return ret
}
