import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import './element-styles.css';
import ArchiveApp from './ArchiveApp.vue';

createApp(ArchiveApp).use(ElementPlus, { locale: zhCn }).mount('#root');
