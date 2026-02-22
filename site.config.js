// 站点配置文件
// 修改此文件来更新网站信息

export const siteConfig = {
  head: {
    title: 'Riordon的个人网站',
    description: 'Author:Riordon,Category:Personal Blog',
    favicon: '/favicon.ico'
  },
  intro: {
    title: 'Riordon',
    subtitle: '心之所向，素履以往',
    enter: 'enter',
    supportAuthor: true,
    background: true
  },
  main: {
    name: 'Riordon',
    signature: 'Go where your heart leads.',
    avatar: {
      link: '/avatar.jpg',
      height: '100',
      width: '100'
    },
    links: [
      {
        href: '/blog/',
        icon: 'bokeyuan',
        text: '博客'
      },
      {
        href: '/about/',
        icon: 'xiaolian',
        text: '关于'
      },
      {
        href: 'mailto:admin@riordon.xyz',
        icon: 'email',
        text: '邮箱'
      },
      {
        href: 'https://github.com/Riordon666',
        icon: 'github',
        text: 'Github'
      }
    ]
  }
}

export default siteConfig
