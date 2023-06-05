# 脚手架命令生成模版

## 本地测试

必须要打成全局包才可以使用该命令，打成全局包的命令 `npm install . -g` 或者 `npm link`。

参考链接： [https://www.cnblogs.com/fangsmile/p/14314230.html](https://www.cnblogs.com/fangsmile/p/14314230.html)

## 本地调试方式

```shell
# 安装依赖
pnpm install

# 查看脚手架当前版本
node ./index.js -v

# 初始化脚手架模板工程
node ./index.js init [project-name]
```

## 使用方式

```shell
# 查看脚手架当前版本
dm-cli -v

# 初始化脚手架模板工程
dm-cli init [project-name]
```

## 脚本依赖

1. inquirer: [https://github.com/SBoudrias/Inquirer.js/tree/master/packages/inquirer/examples](https://github.com/SBoudrias/Inquirer.js/tree/master/packages/inquirer/examples)
2. handlebars: [https://www.npmjs.com/package/handlebars](https://www.npmjs.com/package/handlebars)
3. download-git-repo: [https://gitlab.com/flippidippi/download-git-repo](https://gitlab.com/flippidippi/download-git-repo)
4. shelljs: [https://github.com/shelljs/shelljs](https://github.com/shelljs/shelljs)
5. fs-extra: [https://www.npmjs.com/package/fs-extra](https://www.npmjs.com/package/fs-extra)
