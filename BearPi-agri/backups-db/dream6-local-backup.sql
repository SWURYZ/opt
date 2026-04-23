-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: dream6
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_user`
--

DROP TABLE IF EXISTS `app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `display_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `face_person_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `face_registered` bit(1) NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registered_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3k4cplvh82srueuttfkwnylq0` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_user`
--

LOCK TABLES `app_user` WRITE;
/*!40000 ALTER TABLE `app_user` DISABLE KEYS */;
INSERT INTO `app_user` VALUES (1,'2026-04-23 19:12:14.200093','admin','7e45a5bf0207427f',_binary '','5128640385755e51c06fa3a3fa7dbd042a5e4999a335ae6cecbde41897f2adcb',NULL,'admin','2026-04-23 20:33:30.750784','admin'),(2,'2026-04-23 21:02:09.693001','lyx','ac47e9dfec7847cc',_binary '','5128640385755e51c06fa3a3fa7dbd042a5e4999a335ae6cecbde41897f2adcb','admin','user','2026-04-23 21:02:09.693026','123456');
/*!40000 ALTER TABLE `app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `composite_rule`
--

DROP TABLE IF EXISTS `composite_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `composite_rule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `command_action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `command_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `logic_operator` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `composite_rule`
--

LOCK TABLES `composite_rule` WRITE;
/*!40000 ALTER TABLE `composite_rule` DISABLE KEYS */;
INSERT INTO `composite_rule` VALUES (1,'ON','FAN','2026-04-23 19:56:41.027941','Ê∏©Â∫¶>32¬∞C Ëá™Âä®ÊâìÂºÄÈÄöÈ£éËÆæÂ§á',_binary '','AND','È´òÊ∏©Ëá™Âä®ÈÄöÈ£é','69d75b1d7f2e6c302f654fea_20031104','2026-04-23 19:56:41.027941');
/*!40000 ALTER TABLE `composite_rule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_control_command`
--

DROP TABLE IF EXISTS `device_control_command`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_control_command` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cloud_message_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `command_payload` text COLLATE utf8mb4_unicode_ci,
  `command_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_control_command`
--

LOCK TABLES `device_control_command` WRITE;
/*!40000 ALTER TABLE `device_control_command` DISABLE KEYS */;
INSERT INTO `device_control_command` VALUES (1,'a987fd7a-be8d-49cd-b306-3c3e0f61c2d8','{\"command\":\"ON\"}','LED','2026-04-23 20:33:11.976656','69d75b1d7f2e6c302f654fea_20031104',NULL,'e44dd5dc-8a69-45d6-9024-7e7f40f335bb',NULL,'SENT','2026-04-23 20:33:13.217719'),(3,'69d3a366-8be3-446b-acaf-2b680380e1c7','{\"command\":\"ON\"}','LED','2026-04-23 20:33:54.577140','69d75b1d7f2e6c302f654fea_20031104',NULL,'61c847ff-e713-48d3-91ad-5eb270301244',NULL,'SENT','2026-04-23 20:33:54.664698'),(4,'db599d18-9bd5-4c60-8db5-f7768884afd7','{\"command\":\"ON\"}','MOTOR','2026-04-23 20:33:54.577671','69d75b1d7f2e6c302f654fea_20031104',NULL,'9fd55d74-0681-4c31-89b3-cf16c66e071b',NULL,'SENT','2026-04-23 20:33:54.665280'),(5,'bba37d03-1df0-41e6-91f7-390bad6caf1e','{\"command\":\"ON\"}','LED','2026-04-23 20:57:39.144814','69d75b1d7f2e6c302f654fea_20031104',NULL,'e1fb738f-aba1-4ada-8711-b993a33c1f8d',NULL,'SENT','2026-04-23 20:57:39.486603'),(6,'4c1645a7-e8c3-4b52-9548-8d2ef025810f','{\"command\":\"ON\"}','MOTOR','2026-04-23 20:57:39.661144','69d75b1d7f2e6c302f654fea_20031104',NULL,'e21010c4-beab-42cc-9124-645399be7a79',NULL,'SENT','2026-04-23 20:57:39.742300'),(7,'67602b9a-99a0-46ef-86ca-348086ffd5dd','{\"command\":\"ON\"}','LED','2026-04-23 20:58:30.067613','69d75b1d7f2e6c302f654fea_20031104',NULL,'b78d21fe-b6a5-434c-87c1-cccea20659e2',NULL,'SENT','2026-04-23 20:58:30.151934'),(8,'a00a6863-02fc-4103-b305-097567b2ec02','{\"command\":\"ON\"}','MOTOR','2026-04-23 20:58:30.201025','69d75b1d7f2e6c302f654fea_20031104',NULL,'07e1787f-28e3-46c3-a70c-eaa72eae0206',NULL,'SENT','2026-04-23 20:58:30.283521'),(9,'e8c5215b-730f-48ea-8beb-268d2d5ae085','{\"command\":\"ON\"}','LED','2026-04-23 21:00:59.807081','69d75b1d7f2e6c302f654fea_20031104',NULL,'e01819c6-1636-454a-90cb-24289853b69b',NULL,'SENT','2026-04-23 21:01:00.104980'),(10,'4b588d4e-d4dc-40ad-ab6c-29ebb3f54b8e','{\"command\":\"ON\"}','MOTOR','2026-04-23 21:00:59.807094','69d75b1d7f2e6c302f654fea_20031104',NULL,'936ef3f1-6158-44cd-8fee-ecbaa1ca0b57',NULL,'SENT','2026-04-23 21:01:00.094146'),(11,'c8bf293e-aed8-4373-ba3a-6c122c2bff11','{\"command\":\"ON\"}','LED','2026-04-23 21:02:30.191607','69d75b1d7f2e6c302f654fea_20031104',NULL,'9a3cf387-097f-4403-8c86-13e06eab52df',NULL,'SENT','2026-04-23 21:02:30.485801'),(12,'08a23718-5cfb-4b38-9364-3183bbe55f9c','{\"command\":\"ON\"}','MOTOR','2026-04-23 21:02:30.191607','69d75b1d7f2e6c302f654fea_20031104',NULL,'be9dc620-d041-4d64-9723-85c267f6c77f',NULL,'SENT','2026-04-23 21:02:30.471756'),(13,'ac71ed0f-8933-45ce-b6d3-efce0d7d225c','{\"command\":\"ON\"}','MOTOR','2026-04-23 21:05:28.330403','69d75b1d7f2e6c302f654fea_20031104',NULL,'50b23b87-e42d-40cc-a41c-7a6cfabbd655',NULL,'SENT','2026-04-23 21:05:28.624036'),(14,'b1c2e3a6-eade-4b4a-be79-080ba410a42b','{\"command\":\"ON\"}','LED','2026-04-23 21:05:28.331327','69d75b1d7f2e6c302f654fea_20031104',NULL,'facce96f-df7f-4763-80c3-c04257d89ab1',NULL,'SENT','2026-04-23 21:05:28.598634'),(15,'ed19f129-6815-41c7-8611-87b3dfe9f94c','{\"command\":\"ON\"}','MOTOR','2026-04-23 21:05:48.270284','69d75b1d7f2e6c302f654fea_20031104',NULL,'c20dbe5e-d7c6-44f9-8d12-06a40b03f520',NULL,'SENT','2026-04-23 21:05:48.347275'),(16,'919cb70b-16bd-44f3-9949-7e6aa39368b6','{\"command\":\"ON\"}','LED','2026-04-23 21:05:48.270285','69d75b1d7f2e6c302f654fea_20031104',NULL,'667c428c-9135-460c-a91c-81b0c4ef95ed',NULL,'SENT','2026-04-23 21:05:48.354921'),(17,'cf447e20-775b-446d-beda-cb2112ab85f9','{\"command\":\"ON\"}','LED','2026-04-23 21:16:54.027514','69d75b1d7f2e6c302f654fea_20031104',NULL,'436c4123-0561-4871-b75a-f7de962ad8d2',NULL,'SENT','2026-04-23 21:16:54.412346'),(18,'57709094-d296-4acf-8133-224ed59b3ce1','{\"command\":\"ON\"}','MOTOR','2026-04-23 21:16:54.028120','69d75b1d7f2e6c302f654fea_20031104',NULL,'331d2009-4a30-4d1a-885a-c102685fcc93',NULL,'SENT','2026-04-23 21:16:54.425688'),(19,'60aa8bb0-af01-41aa-a8dc-c54033791d24','{\"command\":\"ON\"}','LED','2026-04-23 21:27:27.025400','69d75b1d7f2e6c302f654fea_20031104',NULL,'f2b643c9-570f-4763-9975-ba1aabce05d0',NULL,'SENT','2026-04-23 21:27:27.373799'),(20,'b01f486b-399c-40c4-b93b-94c72786b893','{\"command\":\"ON\"}','MOTOR','2026-04-23 21:27:27.582463','69d75b1d7f2e6c302f654fea_20031104',NULL,'00291538-ba02-4744-9303-1969acd153aa',NULL,'SENT','2026-04-23 21:27:27.661572');
/*!40000 ALTER TABLE `device_control_command` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_greenhouse_mapping`
--

DROP TABLE IF EXISTS `device_greenhouse_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_greenhouse_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bound_at` datetime(6) NOT NULL,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `greenhouse_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unbound_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKbsbv2ppehj60cb37m7ic4v9xm` (`device_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_greenhouse_mapping`
--

LOCK TABLES `device_greenhouse_mapping` WRITE;
/*!40000 ALTER TABLE `device_greenhouse_mapping` DISABLE KEYS */;
INSERT INTO `device_greenhouse_mapping` VALUES (1,'2026-04-23 19:12:54.015812','MOBILE-IT5DKR','ÁßªÂä®Â∑°Ê£ÄÊâãÊú∫','MOBILE_SCANNER','1Âè∑Â§ßÊ£ö','BOUND',NULL,'2026-04-23 19:12:54.015812'),(2,'2026-04-23 19:56:41.021224','69d75b1d7f2e6c302f654fea_20031104','BearPi ‰∏ªÊéß','BEARPI','GH001','ACTIVE',NULL,'2026-04-23 19:56:41.021224'),(3,'2026-04-23 20:34:23.666731','MOBILE-WMMU8B','ÁßªÂä®Â∑°Ê£ÄÊâãÊú∫','MOBILE_SCANNER','1Âè∑Â§ßÊ£ö','BOUND',NULL,'2026-04-23 20:34:23.666731');
/*!40000 ALTER TABLE `device_greenhouse_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_status`
--

DROP TABLE IF EXISTS `device_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_status` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_updated` datetime(6) NOT NULL,
  `led_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motor_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKoluepxiki8h8bg3lypxhxgbwq` (`device_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_status`
--

LOCK TABLES `device_status` WRITE;
/*!40000 ALTER TABLE `device_status` DISABLE KEYS */;
INSERT INTO `device_status` VALUES (1,'69d75b1d7f2e6c302f654fea_20031104','2026-04-23 20:33:13.336226',NULL,NULL);
/*!40000 ALTER TABLE `device_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `face_record`
--

DROP TABLE IF EXISTS `face_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `face_record` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `embedding` longblob NOT NULL,
  `person_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `person_name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3hda5luuw552ttm5d2nmg2rjg` (`person_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `face_record`
--

LOCK TABLES `face_record` WRITE;
/*!40000 ALTER TABLE `face_record` DISABLE KEYS */;
INSERT INTO `face_record` VALUES (1,'2026-04-23 20:33:30.741805',_binary '\Û˙6º\'ââΩ^o=çùΩëñ<¿YrΩ˚ÕØ;E0ªZ¥©<Æ<æÖú<\œ·ØºòàFΩ\Ò\›=¯™éº˝∂&=°§’ºxò?=±T\ƒ<\‰ÆP=<\Í˚<g=\ŸΩ[◊á∫\¬b\0º\Ìe=\Ï:ºv\‰æ;z®Æ<\“	=3P=y\¬G=u2<$˙=§ø^=Ö3◊ºvÖã;L≤&Ω*=/U%<-)ò<~\n9Ω\rîª3™=\‘q=g≤&ºú=&…ªp\ÀJΩ/\ﬂΩB=\–,¯Ω∂0=5\Ô7Ω|aŒºP∫\ı=9û\„<~Ï™º5do=ò\	=\r˝gºt-í;¸ˇ=ï\«\Áª\Í=<£=˝.2<Q\Ÿ=L;hΩ\0:ïΩ˘}v:%}\Œ=\—>ºΩ¯BΩå\œa;\◊TΩ\r\Z<\⁄\…_=Ãû˘;Æ¸“ºÅà7<\”\'\0Ωt@=\ÓÀ±<ñ8rº$\Ì9Ω˛B€ºU\‡eº[ú<\È\\=1\ÈΩ\·\"ΩæM\Ë<5éªù8y<é~6Ω∂.>Hbõºä\v<	\˜;•˝åΩ>›∞ªÅ$Ω=}$:ª\Ó<Æì≤ºÄíô=\Ùoí=¨3ØΩáõ;Vπ”Ω©ì<t	^Ω†x≤<HÖΩ\ÎW=ΩSMº^\\\Ú<òüΩO0=\‰^∫í\„\Z=-FD<§\0´<}ΩfΩr!Ω=d\◊=\∆	‘ªH˝\Íº_ﬂªôÏüº\ÒΩ⁄Ñº0†W=<Æê=•|c=\÷-J:7/=\ÿ5ïΩÅ\—\Â=Yò˙ªcø3Ω\Áº	;”ΩêVΩ:1ôy<`\Ú=\€Aˇ:\ﬁ¡:ΩAS\<T\Ò\›<JΩ8=¡n!Ω\¬\Z=\∆E<S4ç=\\\„•=-\‹–ª\Ÿé=\ÿHº<m&∫˘cPº:5<\Z{=¡ëG=∑â\√<I0\rΩVv¨<p5ä<ä\'tΩH\À8<d\«<\Ì\Õ;\ÈcÑ<4\∆<6.\Ù<,\"¿<¸z$Ω“á\Èº\Îr°Ω\÷réΩ\Ÿc=\"…£º\Á†*<[}d<4…øºEßM<n$µΩŒ°ú=≤´<\"≥#=å	z<32º!ì;-\\\”<NC=∑(oº°∂kΩÈö•<˛4<˝\n±<√á$<\rJ_Ω\÷\ıºS\“t<´=w˝\ﬂ;ëØµ=R¥8<ók<;Y=DòŒº\Zhö<Euºp;√ºü!äΩ/$π<¥5º5V\<\ \∆Vª\˜S®º!\◊<”ñ~=êÜhΩ◊πnºé\Z≈º\ıG=\ÓéΩÉºÇ<\\\0î=Yª≤Ω∞§Ä=\œ=\Ï\Ì$ΩxïùΩ\\»ù=Ont=Ø(Ã∫ùROΩEN;‡ºæ=y≠—º\ÎX&=\À\:=\È\Íó<uÀ≠<\›iûΩµ∞4º_2\π¸\‡\«<yª\ﬂ=°ËçºI\r$<\∆Ø=—ö:L\"ZΩ-ó`=πèº.Õº\\==\"´*<á˝\'<Ä`Ω<:9Ø\ı<\Ò\·lºQaΩ\Ë\»=ò—ªº\‹Ω+e\Úº´\—<\À˙mºØ¢˛<(\Ë=è3É<#˘òºf≥ÕΩ\r|/<\ÿHHº‘ÖX∫©ßêº∏67=B}Ωkgπ<Fg@Ω˚ôº\r\r<BS\·<q5\ﬁ<a∞<k%±=¶Ω\˜ä\ÏΩ;3º‘Ü=æRuº\≈}=|‹á=≥ ¶ª°Z\…<Öû€ª+b≈ΩËª≠;ù\rº/Eù:$)Ω2§G=¿áÔº∏/:}¥ΩUX•ªpáº(\⁄=\Ò<õ¨ΩM\:ª)E=ü\œw;3\„\”<\ b¥ΩG®?=ÜX)<@\nΩºõ\˜<í∂<ãk≤<˛\ æJ∫6Ω∑ï\˜ΩS\ÛÅ=\ÎΩ\∆\ÿ%º∑Ω¶:ñ^ ==Õõº\ˆ\ÁΩ°\ƒ<±@ùªséª\‡™\”<@\Z˝<o\Õ\Ôº\ƒ\\áΩ\Â\√G<_¿Fº¨%\\=¸ÈÇº;\ƒˇΩ\Ìá-<\n\«\Ò<\»ÎØº´\Àƒº;íã<≠SD=D\⁄\“<l√ßΩDW=Ω˝y=|uÑ<Öpï<˛˝∫êv\‘<\Õ/íº\Ò[ºÃê]Ω\Œ\÷!=qdª:YØª˘\«…ª\ﬁa	Ωê\"k<…á®;\ÁˇøºîI{=ñ¸GΩ!MÉº—ó=\"˙=º08;%´\≈<[êÜ;&\Ò=Éi^<Ñ∫ñºDøΩf$\Ã;\Z[Ω˙∏+ªi\Ïº#\‡‘ΩØØº\‹oºV\·\‚ºy\\Ñ=&b&=\n\√$;ù)Ω\0GsΩ#\…\"ΩnüïªFYÉΩ7≈ΩF[Àº\⁄˛	πd\ÿD=èï+=Èéî=àØΩ¸‹õΩh$5Ω\–#Ω£|‘ªF\À<\Î<äΩ¨’òΩ\·\Í’º`&—º¨Õ•=UjZºÖ6ΩU\0;\˜\‡à<Lc<ß[É<x\„ª\Õ\ﬂ\∆<ör±∫Å\Ë¬ΩH|ŸºJ\Ë®=≤\ÏcΩ\‰ä*Ω\⁄EﬁªN¥∫\ˆ](<oÀ≠º&à=\›≥∫=´x=\⁄%$Ωlé\›<¶\–¿;\›_$=\›`6<B0\„<xb§=5\Ô$º•<e√áº\›Y6=;lëºçíåΩ˘–åºXpA<“∑=Ø1†ª.\ÚEΩf\—z=l∏c=î+í<d¢\Ù<äw=\Ê∞?ΩN,ºl\ﬁ<:…Öº∏\	=\‹\›\‚º˝=íwa<\·W\nºWr=\˜\ >=C%9º0\›?=Yo\⁄=¯á|<•YkΩMfÑ=ÅΩ\T§∫Äç˝<ç\’u= ûá=ø\„˚<a\—lΩºO∫\ÎW\‚<;®=\ŸΩ±ÏÅº\ÛÉî=¥æ<1‹Ωº\ÔvFΩ¨\ÓS<r⁄ó=\Á{º	\\\«<v{\Z=0˙<ûâ1=¡Xº\«nΩì\r=m›ëΩ\Ëî=¸\n\∆</4≤:ÉI(Ω\“Sº<','7e45a5bf0207427f','admin','2026-04-23 20:33:30.741805'),(2,'2026-04-23 21:02:09.687535',_binary '%Œ∏º\0Ü∫¡\"≈ªØ˝∫•\Ù<\Ïø\‰º\ÿ√∏;3cXº<∂Gª \ÂΩ%áx=r\¬sº\ \“=-\Õd:≠â3=˚t=Q\ª=hD<Xh\0æöÆª<Ë±Ω4£\Ô<\€;&\√*ªA\eΩG∂∑Ω\…](Ω•YnΩ]≤ì;geΩY∑ª\Ë!<\Á§A=!˚º\0ãΩÎæîΩ\Ÿ-=\¬dûΩ?-LΩª<\Zº0òO=-π≥Ω?ŒÅΩk=º:J¯◊ºwbmºIÆ7Ω\◊a==û\˜¨ºNYúºX®=\»8ï;äZ\‡ª6§Ωp{\Õ<^ÂÑº\·c–º} \Ùº§\Ôl<Kk=\–}‹ºn\…Ω\»˙Üºu⁄âºO\÷\√<~}Ñº\ﬁ:\À<•ÆûΩ\Í\Ê”ºûà\ı<ΩN⁄ºÑV=∫|≠ºä\'=xerΩ\u2Ω∫Z,ΩT≠#πV\Î<ª=çπ\Ô=íΩ@	C=RΩ2\’:=¡M|ΩV|=™¿º¶`Ω6\Ë<ñ&:ùÉmº;ZJΩ\Ò≤i=.î\Ÿ<É∑3=îE\Ó<¯%/Ω\	=|\·º7Ü\0ª\¬\\Ü=˛•;ã°\À=\r‹¶º~ΩÖ©æ;é Ω¢EÉºàW;\‰\Œ\…<ë#\Ã<D¸	=;\Ë$Ω¿{°=àºÜºí‘Üªºä\Î;õ≠´;ÆH=µ?†Ω\r®º¢à\ˆºlê;Àñ\"º\Âw\–<r@•=§#Wº}xΩ˝\È\¬=î-±º∞/ãΩÇÅ9Ω£I=öá(<p\“\‰:á√ãΩ>¥=6 ŸΩ\Ó!<\∆/&Ωi[ºä[ΩyVb<ô=ª˘Z<\◊[w<zj«Ω\Ì~Ω∏<F\‡k<ü	Tª\’{PªP˛K:v\'ÉΩ¶ˇ=˚jaΩ\‡\˜\Ì;=KΩ˛É¿Ω(Ωw\‚=\Ó∑\Ò=ûf”ª|F\⁄;BnMΩ\Í.∂ΩVäÆº∑™Wº\Á ˛ºP\œÏºÑ©\Œ<U¯ä=¨≠ºN\ÿ	ª:\ÙsΩjí≤<|O4ΩD\ıº≠4+=¥å=R\nºøb´ºs∂C==T=Ø\n\Ë9©¨º9{¡<Õº\Úº\·v=pùg={\Ë¸;o∆¥º´gΩŸü¨Ω©úª\”¯\ZΩå†Ω©5Ωcå]ΩÑΩO°\'Ω4\¬)<\ÈºmΩuÎΩï\€k;Œßn=Ö\„<hΩJ~<`è∏º<\0ºï®y=nõo<>æ\"\‡b<¯ùñ=n]@Ω∏ç=WP=S.º¢\Â=P}ßºñMÄΩdä<ut}ΩA>§º\Ì6NΩ≠â≤ªdP\Ã=\n°ºÜ€°<|!º˚uz<Ïòí=íæªçe0<≠¬æº™≠V<,~D;\—^Ω\∆b√º\–L=\0ÜäΩAJπ<\n‹é=¡\r}=D†-=ô∂	Ωº\n\∆<ù\'\Z=ÆG Ω9\Z=∑m4<Gùº†˘\Ÿ<¿F=\“aª;\Úôº\ÏDº\‘5\Âº,§\Îºäæ\’%ÀºÏºø=\œ/à=|èì<˛j2=D\Z<˝*ºg©sº;Ñ:=\€¬º6\–X=ï^[Ω\Z™≠<∑°0=\ÒP\"<=í=\‰\ﬂ∆Ωâ\√<\Ó\ÎΩ.ó\‚;\ˆ\È®<GvÆ<8=n\˜;\Œ\Ÿ<¿òP<˛\ÔÄ=\È\”\n=Ä\¬Áºápïº\Ó<\Ò\·ì;˙öhΩÉ¢º†Qºmö=¨˝.ºˇ)D=\Íì=R\Íã:T1ΩWøºå\0-=∑ÀÇ<IãªS#]=\Õ˝=\Ú\ÁªBSºÉ\‚ò;\…n\„ªgn<Wª≠º√ô∞Ω\Z£¸<œû¨ºmoAΩòµs=kóâ=∑çCºàëî=D§©º¥tR<\ƒpi<ü5=\ƒ\ÎΩ´¸”Ω\ÃM\rΩ[˚N<åK•=#Ωáé≥º±\ﬁF<å…®ª\r˚=H\„ΩŸ∑\<áG∫º¨P◊ªI8∞ºaM3<l-J<Gí§;\Ÿ\ﬂ5Ω≤;\Ó§Ω,>`Ω˘\Ì¯ªhC¸<IóàΩv∂ª¯\⁄IΩ)¬†º\ˆtd<Uv\Âº œÇ=ú{∆Ω@ªà;V∞ÇΩ|$=rûæΩ\Ô\“$ª®p5Ω\Èµ=©£ª*Gu=\È\»º÷ò•Ωª◊≤º¨0ù<µï<Åí=\Ï\ƒ\⁄:I@êΩ∏•≤=π`†<†!\ÔΩ\“Eª¢º<[∏/= \÷6=\‹\r\‰ºi1MΩ2\ÓxΩ¯~<jNHΩa\◊\¬<âªÑΩík=kZ\ˆºøgº<nM√º\Ûì\Ã=\ÓéºxOº\‘*=\ÛX9Ωêc/ΩáªäΩ\–@NΩ\∆…Ω¨G\"Ω96é=ùäP=_/=u˝ºE9\Ìº\ \r@Ωπf<&ÆãΩ.\Œ¸;\‡!\Û;û¨Ω˝\∆;àeΩ\Pº\‘\«eºe\“ª∞3w=\|\Êºo!à;í\œz=ò’ÇΩnçs<ìÉ4=g#ær=J√©=Z\'àΩ\\‹ú<[R=Ç∂rªê\Ó\Õ:¿¡:¿˛\n=Ö∆ºµª\ Ω_oñΩ\n•KΩ§%ß<$π	=w4rª•û<ΩBíº\"‡µº:ü”º\ÙK\ˆª≤\rDΩ±[∫\√vº<ú\Z\0<_q˙ºy˘\“<(\Á˚º¯4kΩ|&º¯ÚúªâOI=\Ÿ7-=\‹7ç=,!-Ω\ﬁ{\–=M&N<àKãºLQaΩ\ƒ<\Úº∏î=<4\Ë<\Á∆ï=;;¥º\ƒ^=,ô;\Û«º†¿fº¸zûΩ7l∏ªõ%º7j°º\—q=\«\–ΩæÉ-ΩkLRΩT\Cº\Á2°ª≤Ñ∏Ω\‡%éΩá±ªG®\nΩR¶<†\Zï<jrvΩ\¬iüΩk=\˜‰¢ºõ]<\‡5=e\€cªêπºâ\nû=&¨<!VΩk\€ΩMÂ≠ºß\ G;\Ól=tX=\ÃP+Ω™/\Ï<','ac47e9dfec7847cc','lyx','2026-04-23 21:02:09.687535');
/*!40000 ALTER TABLE `face_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `greenhouse`
--

DROP TABLE IF EXISTS `greenhouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `greenhouse` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `area_sqm` double DEFAULT NULL,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `crop_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKps31hmqhya4lialur03p3fmph` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `greenhouse`
--

LOCK TABLES `greenhouse` WRITE;
/*!40000 ALTER TABLE `greenhouse` DISABLE KEYS */;
INSERT INTO `greenhouse` VALUES (1,120,'GH001','2026-04-23 19:56:41.018272','Áï™ËåÑ',_binary '','Ë•øÂçóÂ§ßÂ≠¶ÊïôÂ≠¶Âü∫Âú∞','Á§∫ËåÉÊ∏©ÂÆ§ 1 Âè∑','2026-04-23 19:56:41.018272');
/*!40000 ALTER TABLE `greenhouse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `greenhouse_sensor_snapshot`
--

DROP TABLE IF EXISTS `greenhouse_sensor_snapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `greenhouse_sensor_snapshot` (
  `pk` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `greenhouse_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_at` datetime(6) NOT NULL,
  `source_device_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` double NOT NULL,
  PRIMARY KEY (`pk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `greenhouse_sensor_snapshot`
--

LOCK TABLES `greenhouse_sensor_snapshot` WRITE;
/*!40000 ALTER TABLE `greenhouse_sensor_snapshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `greenhouse_sensor_snapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iot_device_command_log`
--

DROP TABLE IF EXISTS `iot_device_command_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iot_device_command_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cloud_command_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `command_payload` text COLLATE utf8mb4_unicode_ci,
  `command_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iot_device_command_log`
--

LOCK TABLES `iot_device_command_log` WRITE;
/*!40000 ALTER TABLE `iot_device_command_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `iot_device_command_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iot_device_telemetry`
--

DROP TABLE IF EXISTS `iot_device_telemetry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iot_device_telemetry` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `humidity` double DEFAULT NULL,
  `led_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `luminance` double DEFAULT NULL,
  `motor_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_payload` text COLLATE utf8mb4_unicode_ci,
  `report_time` datetime(6) NOT NULL,
  `service_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iot_device_telemetry`
--

LOCK TABLES `iot_device_telemetry` WRITE;
/*!40000 ALTER TABLE `iot_device_telemetry` DISABLE KEYS */;
/*!40000 ALTER TABLE `iot_device_telemetry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `light_schedule_execution_log`
--

DROP TABLE IF EXISTS `light_schedule_execution_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `light_schedule_execution_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cloud_message_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `executed_at` datetime(6) NOT NULL,
  `rule_id` bigint NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `light_schedule_execution_log`
--

LOCK TABLES `light_schedule_execution_log` WRITE;
/*!40000 ALTER TABLE `light_schedule_execution_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `light_schedule_execution_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `light_schedule_rule`
--

DROP TABLE IF EXISTS `light_schedule_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `light_schedule_rule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `command_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` bit(1) NOT NULL,
  `repeat_mode` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rule_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `turn_off_time` time(6) NOT NULL,
  `turn_on_time` time(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `light_schedule_rule`
--

LOCK TABLES `light_schedule_rule` WRITE;
/*!40000 ALTER TABLE `light_schedule_rule` DISABLE KEYS */;
INSERT INTO `light_schedule_rule` VALUES (1,'LIGHT','2026-04-23 19:56:41.025227','69d75b1d7f2e6c302f654fea_20031104',_binary '','DAILY','ÈªòËÆ§Êó•ÂÖâË°•ÂÖâ','18:30:00.000000','06:30:00.000000','2026-04-23 19:56:41.025227');
/*!40000 ALTER TABLE `light_schedule_rule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `linkage_action_log`
--

DROP TABLE IF EXISTS `linkage_action_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `linkage_action_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cloud_message_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `command_action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `command_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `condition_snapshot` text COLLATE utf8mb4_unicode_ci,
  `dispatch_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rule_id` bigint NOT NULL,
  `rule_name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `triggered_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `linkage_action_log`
--

LOCK TABLES `linkage_action_log` WRITE;
/*!40000 ALTER TABLE `linkage_action_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `linkage_action_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_log`
--

DROP TABLE IF EXISTS `login_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_time` datetime(6) NOT NULL,
  `login_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_log`
--

LOCK TABLES `login_log` WRITE;
/*!40000 ALTER TABLE `login_log` DISABLE KEYS */;
INSERT INTO `login_log` VALUES (1,'116.251.216.192','admin','2026-04-23 19:12:14.233599','register',1,'admin'),(2,'116.251.216.192','admin','2026-04-23 19:27:12.472138','password',1,'admin'),(3,'103.62.49.149','admin','2026-04-23 20:33:03.569089','password',1,'admin'),(4,'103.62.49.149','admin','2026-04-23 20:33:47.541858','face',1,'admin'),(5,'39.144.219.8','admin','2026-04-23 21:00:45.316085','password',1,'admin'),(6,'39.144.219.8','lyx','2026-04-23 21:02:18.178558','face',2,'123456'),(7,'39.144.219.8','lyx','2026-04-23 21:05:15.919439','face',2,'123456'),(8,'39.144.219.8','lyx','2026-04-23 21:05:36.452204','face',2,'123456'),(9,'113.249.30.158','lyx','2026-04-23 21:16:46.029581','face',2,'123456');
/*!40000 ALTER TABLE `login_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rule_condition`
--

DROP TABLE IF EXISTS `rule_condition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_condition` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `operator` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sensor_metric` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `threshold` double NOT NULL,
  `rule_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK2hxlxgns6se9pb8oraeos6iim` (`rule_id`),
  CONSTRAINT `FK2hxlxgns6se9pb8oraeos6iim` FOREIGN KEY (`rule_id`) REFERENCES `composite_rule` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_condition`
--

LOCK TABLES `rule_condition` WRITE;
/*!40000 ALTER TABLE `rule_condition` DISABLE KEYS */;
INSERT INTO `rule_condition` VALUES (1,'>','temperature','69d75b1d7f2e6c302f654fea_20031104',32,1);
/*!40000 ALTER TABLE `rule_condition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensor_latest_data`
--

DROP TABLE IF EXISTS `sensor_latest_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensor_latest_data` (
  `pk` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_at` datetime(6) NOT NULL,
  `metric_value` double NOT NULL,
  PRIMARY KEY (`pk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensor_latest_data`
--

LOCK TABLES `sensor_latest_data` WRITE;
/*!40000 ALTER TABLE `sensor_latest_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `sensor_latest_data` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-23 21:51:17
