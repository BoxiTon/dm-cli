#!/usr/bin/env node
// 处理用户输入的命令
const program = require('commander');
// 问题交互
const inquirer = require('inquirer');
// node 文件模块
const fs = require('fs');
// 文件模块扩展
const fse = require('fs-extra');
// shell 命令行
const shell = require('shelljs');
// 动画效果
const ora = require('ora');
// 字体加颜色
const chalk = require('chalk');
// 显示提示图标
const symbols = require('log-symbols');
// 版本号
const { version } = require('./package.json');

const questions = [
  {
    name: 'name',
    message: 'Input the package name',
    default: 'project-manage'
  },
  {
    name: 'description',
    message: 'Input the object description',
    default: 'create Object description.'
  },
  {
    name: 'author',
    message: 'Input the object author',
    default: 'default author'
  },
  {
    type: 'list',
    name: 'template',
    message: 'which template do you want to select?',
    choices: [
      {
        name: 'the template which has login module and common module',
        value: 'xx-template'
      }
    ]
  }
];

program
  .version(version, '-v, --version')
  .command('init <name>')
  .action((name) => {
    // 文件名称
    if (!fs.existsSync(name)) {
      inquirer.prompt(questions).then((answers) => {
        // 从远处仓库下载
        downloadTemplateFromNPM(name, answers);
      });
    } else {
      // 错误提示项目已存在，避免覆盖原有项目
      console.log(symbols.error, chalk.red('The object has exist'));
    }
  });
program.parse(process.argv);

// --- start 从远处仓库下载脚手架模板 ---

/**
 * 从远处仓库下载脚手架模板
 *
 * @param {String} projectName 项目文件夹名称
 * @param {Object} answers 答案列表
 */
async function downloadTemplateFromNPM(projectName, answers) {
  let steps = [];
  let templateName = answers.template;
  const isMultiPackageName = isTwoFileDirPackage(templateName);
  // 是否存在拉包工具
  const isExistPackageTools = await checkIsInstallPlugins("download-npm-package");

  // 若不存在，则进行工具安装
  if (!isExistPackageTools) {
    steps.push(`npm -g install download-npm-package`);
  }

  // 拉取模块包
  steps.push(`download-npm-package ${templateName}@latest`);

  // 重命名包文件
  if (!isMultiPackageName) {
    console.log("重命名");
    steps.push(`rename ${templateName} ${projectName}`);
  }

  // 开始执行命令
  const spinner = ora('Downloading...');
  spinner.start();

  // 执行命令
  shell.exec(steps.join("&&"), { async: true, encoding: 'utf-8' }, async (code, stdout, stderr) => {
    // console.log('Exit code:', code);
    // console.log('Program output:', stdout);
    if (code > 0) {
        spinner.fail();
        console.log(symbols.error, chalk.red(code, code));
        console.log('Program stderr:', stderr);
    } else {
        // 是否多级文件包名
        if (isMultiPackageName) {
          // 移动文件夹内容
          await movePackageFiles(templateName, projectName);

          // 移除外围包裹的文件夹层
          await removeWrapperPackageFile(templateName);
        }

        // 修改包信息
        changePackageJSON(projectName, answers);

        spinner.succeed();
        console.log(symbols.success, chalk.green('The vue object has downloaded successfully!'));
    }
  });
}


/**
 * 将 cmd 执行方法转为 promise
 *
 * @param {String} cmd 命令行内容
 * @returns {String} 执行返回信息
 */
function execCmd2Promise(cmd) {
  return new Promise((resolve, reject) => {
    shell.exec(cmd, function (error, stdout, stderr) {
      if (error) {
        reject(stderr)
      }
      resolve(stdout)
    });
  });
}

/**
 * 检测依赖包命令文件是否存在
 *
 * @param {String} pluginName 依赖包名称
 * @returns {Boolean} true | false
 */
function checkIsInstallPlugins(pluginName) {
  return new Promise(async (resolve) => {
    let prefix = await execCmd2Promise('npm config get prefix');
    fs.access(`${prefix.trim()}\\${pluginName}.cmd`, fs.constants.F_OK, function (err) {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * 是否包名为二级目录
 *
 */
function isTwoFileDirPackage(packageName) {
  return /\//g.test(packageName);
}

/**
 * 移除外围包裹的文件夹层
 *
 */
function removeWrapperPackageFile(packageName) {
  let pattern = new RegExp(".*(?=/)", "g");
  let result = pattern.exec(packageName);
  if (result) {
    let name = result[0];
    return new Promise(async (resolve) => {
      fse.remove(name).then(() => {
        resolve(true);
      }).catch(err => {
        console.log(err);
      })
    });
  } else {
    console.warn("移动外围文件夹失败");
    return false;
  }

}

/**
 * 移动文件夹内容
 *
 */
function movePackageFiles(templateName, projectName) {
  return new Promise(async (resolve) => {
    fse.move(templateName, projectName, { overwrite: true }).then(() => {
      resolve(true);
    }).catch(err => {
      console.log(err);
    })
  });
}

/**
 * 修改 package.json 文件信息
 *
 * @param {*} name
 * @param {*} answers
 */
function changePackageJSON(projectName, answers) {
  const _fileUrl = `./${projectName}/package.json`;
  let packageObj = fse.readJsonSync(_fileUrl);

  // 修改信息
  packageObj.name = answers.name;
  packageObj.version = "1.0.0";
  packageObj.description = answers.description;
  packageObj.author = answers.author;
  delete packageObj.publishConfig

  fse.writeJsonSync(_fileUrl, packageObj, { spaces: '\t' });
}

// --- end 从远处仓库下载脚手架模板 ---
// --- start 从 gitlab下载脚手架模板 ---

/**
 * 从 gitlab下载脚手架模板
 *
 */
function downloadTemplateFromGit(name, answers) {
  const spinner = ora('Downloading...');
  const pattern = new RegExp(`^template\\\\${answers.template}`);
  spinner.start();
  // 下载 github 上模板
  download(
      'direct:http://xx-template.zip',
      name,
      {
          clone: false,
          filter: file => filterFiles(file, pattern),
          map: file => resolveFileUrls(file, pattern)
      },
      err => {
          if (err) {
              spinner.fail();
              console.log(symbols.error, chalk.red(err));
          } else {
              spinner.succeed();
              const fileName = `${name}/package.json`;
              const meta = {
                  name,
                  description: answers.description,
                  author: answers.author
              };
              if (fs.existsSync(fileName)) {
                  const content = fs.readFileSync(fileName).toString();
                  const result = handlebars.compile(content)(meta);
                  console.log(result);
                  fs.writeFileSync(fileName, result);
              }
              console.log(symbols.success, chalk.green('The vue object has downloaded successfully!'));
          }
      }
  );
}

/**
 * 过滤模板文件夹并上提一级
 *
 * @param {String} file 文件
 * @param {RegExp} pattern 正则表达式
 */
function filterFiles(file, pattern) {
  return pattern.test(file.path);
}

/**
 * 处理释放文件夹的路径
 *
 * @param {String} file 文件
 * @param {RegExp} pattern 正则表达式
 */
function resolveFileUrls(file, pattern) {
  file.path = file.path.replace(pattern, '');
  return file;
}

// --- end 从 gitlab下载脚手架模板 ---
