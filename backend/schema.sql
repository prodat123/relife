-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 24, 2026 at 09:52 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u513798782_relife_dup`
--

-- --------------------------------------------------------

--
-- Table structure for table `daily_quests`
--

CREATE TABLE `daily_quests` (
  `id` int(11) NOT NULL,
  `date` datetime NOT NULL,
  `quest_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `stats` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `levelRequired` int(11) NOT NULL,
  `rarity` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `type`, `description`, `image_url`, `stats`, `levelRequired`, `rarity`) VALUES
(1, 'Leather Hood', 'head', 'A hood made out of goblin leather.', '/sprites/equipment/leather_hood.png', '{\"armor\": 7}', 2, 'peasantly'),
(2, 'Leather Gambeson', 'torso', 'An underpiece made out of goblin leather and wool', '/sprites/equipment/leather_gambeson.png', '{\"armor\": 10}', 2, 'peasantly'),
(3, 'Leather Pants', 'legs', 'Some ugly pants made out of goblin leather', '/sprites/equipment/leather_pants.png', '{\"armor\": 9}', 2, 'peasantly'),
(4, 'Leather Shoes', 'feet', 'A pair of shoes made out of suspicious leather', '/sprites/equipment/leather_shoes.png', '{\"armor\": 6}', 2, 'peasantly'),
(5, 'Leather Skirt', 'legs', 'A stylish skirt that will attract all the goblins to the floor.', '/sprites/equipment/leather_skirt.png', '{\"hitAbility\": 4}', 2, 'peasantly'),
(6, 'Leather Shirt', 'torso', 'You\'re gonna wear a leather shirt?', '/sprites/equipment/leather_shirt.png', '{\"hitAbility\": 3}', 2, 'peasantly'),
(7, 'Leather Clogs', 'feet', 'Not very protective but great for kicking!', '/sprites/equipment/leather_clogs.png', '{\"damage\": 6}', 2, 'peasantly'),
(8, 'Leather Fedora', 'head', 'You will certainly win more arguments while wearing this', '/sprites/equipment/leather_fedora.png', '{\"magicResistance\": 5}', 2, 'artisan'),
(9, 'Iron Helmet', 'head', 'Some gear forged by some random guy named Smith', '/sprites/equipment/iron_helmet.png', '{\"armor\": 24, \"parry\": -2, \"hitAbility\": -2}', 12, 'artisan'),
(10, 'Iron Chestplate', 'torso', 'A chestplate that\'s a little too big for your torso', '/sprites/equipment/iron_chestplate.png', '{\"armor\": 34, \"parry\": -3,\"hitAbility\": -2}', 12, 'artisan'),
(11, 'Iron Pants', 'legs', 'A pair of pants that\'s really hard to run in', '/sprites/equipment/iron_pants.png', '{\"armor\": 30, \"parry\": -3, \"hitAbility\": -3}', 12, 'artisan'),
(12, 'Iron Boots', 'feet', 'Some boots shaped to match your feet', '/sprites/equipment/iron_boots.png', '{\"armor\": 28, \"parry\": -4, \"hitAbility\": -2}', 12, 'artisan'),
(13, 'Iron Bucket', 'head', 'It goes on the head.', '/sprites/equipment/iron_bucket.png', '{\"armor\": 24, \"parry\": 2}', 12, 'artisan'),
(14, 'Bone-Horned Helmet', 'head', 'Built from the remnants of a skeleton defeated in combat', '/sprites/equipment/bone_horned_helmet.png', '{\"armor\": 18, \"damage\": 12}', 12, 'artisan'),
(15, 'Bone Ribcage', 'torso', 'As opposed to a ribcage that\'s not made of bones?', '/sprites/equipment/bone_ribcage.png', '{\"armor\": 18, \"magicResistance\": 8}', 12, 'artisan'),
(16, 'Bone Sandals', 'feet', 'Taken from a necromancer, filled with magical residue but uncomfortable to wear', '/sprites/equipment/bone_sandals.png', '{\"armor\": 18, \"magicPenetration\": 8}', 12, 'artisan'),
(17, 'Bone Breeches', 'legs', 'It looks shakespearean and makes you feel more confident in attacking', '/sprites/equipment/bone_breeches.png', '{\"armor\": 18, \"hitAbility\": 5}', 12, 'artisan'),
(18, 'Steel Cuirass', 'torso', 'Business in the front, party in the back', '/sprites/equipment/steel_cuirass.png', '{\"armor\": 48, \"parry\": -5, \"hitAbility\": -4}', 20, 'knightly'),
(19, 'Steel Bascinet', 'head', 'Covers your eyes so it\'s hard to see, but durable against even hard blows', '/sprites/equipment/steel_bascinet.png', '{\"armor\": 42, \"parry\": -4, \"hitAbility\": -4}', 20, 'knightly'),
(20, 'Steel Chausses', 'legs', 'Surprisingly good-looking, durable, and unsurprisingly hard to manuever in', '/sprites/equipment/steel_chausses.png', '{\"armor\": 48, \"parry\": -5, \"hitAbility\": -4}', 20, 'knightly'),
(21, 'Steel Sabatons', 'feet', 'NO! Not the metal band. This is metal though. But it\'s METAL-metal. It\'s very hard.', '/sprites/equipment/steel_sabatons.png', '{\"armor\": 44, \"parry\": -4, \"hitAbility\": -4}', 20, 'knightly'),
(22, 'Arcane Robe', 'torso', 'It also functions as a bathrobe that dries you off automatically', '/sprites/equipment/arcane_robe.png', '{\"armor\": 28, \"magicResistance\": 12}', 20, 'knightly'),
(23, 'Arcane Tippy Hat', 'head', 'This hat is magically stubby.', '/sprites/equipment/arcane_tippy_hat.png', '{\"armor\": 28, \"magicPenetration\": 12}', 20, 'knightly'),
(24, 'Arcane Slippers', 'feet', 'Very comfy and, if you say the magic words, will make you levitate 2 inches.', '/sprites/equipment/arcane_slippers.png', '{\"armor\": 26, \"damage\": 20}', 20, 'knightly'),
(25, 'Arcane Jeans', 'legs', 'These are very valuable after the collapse of Levitating Levi\'s', '/sprites/equipment/arcane_jeans.png', '{\"armor\": 26, \"manaRegen\": 80}', 20, 'knightly'),
(26, 'Plague Mask', 'head', 'Used in antiquity to protect doctors from the bad miasma of the sick and dying', '/sprites/equipment/plague_mask.png', '{\"armor\": 40, \"magicResistance\": 20}', 30, 'knightly'),
(27, 'Plague Robe', 'torso', 'Carries lots of medieval medicine that smells nice', '/sprites/equipment/plague_robe.png', '{\"armor\": 44, \"magicResistance\": 20}', 30, 'knightly'),
(28, 'Plague Shoes', 'feet', 'Stops bad miasma from entering and infecting your toenails', '/sprites/equipment/plague_shoes.png', '{\"armor\": 36, \"manaRegen\": 40}', 30, 'knightly'),
(29, 'Plague Pants', 'legs', 'Makes you look stylish in the apocalypse amongst hordes of the infected', '/sprites/equipment/plague_pants.png', '{\"armor\": 38, \"magicResistance\": 18}', 30, 'knightly'),
(30, 'Crimson Helmet', 'head', 'A powerful helmet made up of Crimson Energy', '/sprites/equipment/crimson_helmet.png', '{\"armor\": 100}', 99, 'noble'),
(31, 'Crimson Chestplate', 'torso', 'A powerful chestpiece made up of Crimson Energy, granting bravery to the user', '/sprites/equipment/crimson_chestplate.png', '{\"armor\": 100}', 99, 'noble'),
(32, 'Crimson Pants', 'legs', 'A pair of pants woven by special threads which infuse Crimson Energy', '/sprites/equipment/crimson_pants.png', '{\"armor\": 100}', 99, 'noble'),
(33, 'Crimson Boots', 'feet', 'A pair of boots made by Crimson Energy', '/sprites/equipment/crimson_boots.png', '{\"armor\": 100}', 99, 'noble'),
(34, 'David Jacket(Cyberpunk)', 'torso', 'A futuristic looking jacket that the protagonist of Cyberpunk used.', '/sprites/equipment/david_jacket(cyberpunk).png', '{\"armor\": 100}', 99, 'emperor'),
(35, 'Crystal Helmet', 'head', 'A helmet made up of the rarest crystals', '/sprites/equipment/crystal_helmet.png', '{\"armor\": 80, \"parry\": -6, \"hitAbility\": -5}', 30, 'noble'),
(36, 'Crystal Chestplate', 'torso', 'An artistic chestpiece made up of the rarest crystals', '/sprites/equipment/crystal_chestplate.png', '{\"armor\": 76, \"parry\": -10}', 30, 'noble'),
(37, 'Crystal Leggings', 'legs', 'A pair of pants that is made up of the rarest crystals', '/sprites/equipment/crystal_leggings.png', '{\"armor\": 78, \"parry\": -4, \"hitAbility\": -6}', 30, 'noble'),
(38, 'Crystal Boots', 'feet', 'A pair of boots that is made up of the rarest crystals', '/sprites/equipment/crystal_boots.png', '{\"armor\": 78, \"parry\": -8, \"hitAbility\": -2}', 30, 'noble'),
(39, 'Dragon Helmet', 'head', 'The best helmet in the game made by the blood and teeth of dragons.', '/sprites/equipment/dragon_helmet.png', '{\"armor\": 100}', 99, 'kingly'),
(40, 'Dragon Chestplate', 'torso', 'The best chestpiece in the game made by the blood and teeth of dragons.', '/sprites/equipment/dragon_chestplate.png', '{\"armor\": 100}', 99, 'kingly'),
(41, 'Dragon Pants', 'legs', 'The best pair of pants in the game made by the blood and teeth of dragons.', '/sprites/equipment/dragon_pants.png', '{\"armor\": 100}', 99, 'kingly'),
(42, 'Dragon Boots', 'feet', 'The best pair of boots in the game made by the blood and teeth of dragons.', '/sprites/equipment/dragon_boots.png', '{\"armor\": 100}', 99, 'kingly'),
(43, 'Cloth Sword', 'weapon', 'What? A cloth sword? Are you okay?', '/sprites/equipment/cloth_sword.png', '{\"hitAbility\": 2, \"damage\": 4}', 1, 'peasantly'),
(44, 'Wooden Sword', 'weapon', 'A sword carved out of pumpkins. Just kidding, it\'s trees.', '/sprites/equipment/wooden_sword.png', '{\"hitAbility\": 5, \"parry\": 4}', 2, 'peasantly'),
(45, 'Wooden Axe', 'weapon', 'An axe carved out of the very trees its predecessor cut down', '/sprites/equipment/wooden_axe.png', '{\"hitAbility\": 4, \"damage\": 7}', 2, 'peasantly'),
(46, 'Wooden Dagger', 'weapon', 'It leaves a lot of splinters in your enemy but otherwise not very effective', '/sprites/equipment/wooden_dagger.png', '{\"hitAbility\": 3, \"parry\": -2, \"damage\": 10} ', 2, 'peasantly'),
(47, 'Wooden Wand', 'weapon', 'Embued with natural magical energy, it has a faint smell of lavender...', '/sprites/equipment/wooden_wand.png', '{\"hitAbility\": 1, \"parry\": 1, \"magicPenetration\": 7}', 2, 'artisan'),
(48, 'Wooden Shield', 'weapon', 'Poorly built and barely capable of tanking hits, it\'s better than being hit directly...', '/sprites/equipment/wooden_shield.png', '{\"hitAbility\": -3, \"parry\": 5, \"armor\": 10}', 2, 'peasantly'),
(49, 'Wooden Claws', 'weapon', 'You\'re buying wooden claws? Okay. They\'re pretty easy to use, at least', '/sprites/equipment/wooden_claws.png', '{\"hitAbility\": 4, \"parry\": -3, \"damage\": 10}', 2, 'artisan'),
(50, 'Wooden Mallet', 'weapon', 'Deals a ton of damage but not exactly effective at actually striking the enemy.', '/sprites/equipment/wooden_mallet.png', '{\"hitAbility\": -3, \"damage\": 20}', 2, 'peasantly'),
(51, 'Wooden Gloves', 'weapon', 'What do you mean wooden gloves? Like... you just wear wood on your hands?', '/sprites/equipment/wooden_gloves.png', '{\"hitAbility\": 5, \"parry\": 2, \"damage\": 5}', 2, 'artisan'),
(52, 'Iron Shield', 'weapon', 'Doesn\'t do any damage but it certainly blocks enemy attacks', '/sprites/equipment/iron_shield.png', '{\"parry\": 10, \"armor\": 12}', 12, 'artisan'),
(53, 'Iron Sword', 'weapon', 'A common sword that guards use to defend the tower.', '/sprites/equipment/iron_sword.png', '{\"hitAbility\": 10, \"parry\": 6, \"damage\":22}', 12, 'artisan'),
(54, 'Iron Dagger', 'weapon', 'Similar to the weapon used to assassinate Julius Caesar.', '/sprites/equipment/iron_dagger.png', '{\"hitAbility\": 6, \"parry\": -8, \"damage\": 30}', 12, 'artisan'),
(55, 'Iron Hammer', 'weapon', 'Hefty, definitely not swift, and devastating', '/sprites/equipment/iron_hammer.png', '{\"hitAbility\": -10, \"parry\": -2, \"damage\": 40}', 12, 'artisan'),
(56, 'Cherry Wood Staff', 'weapon', 'Doesn\'t taste like cherry at all, but certainly does the job regardless', '/sprites/equipment/cherry_wood_staff.png', '{\"hitAbility\": 8, \"parry\": 8, \"magicPenetration\": 24}', 12, 'knightly'),
(57, 'Iron Club', 'weapon', 'Extremely heavy but it gets the job done. Bash bash bash!', '/sprites/equipment/iron_club.png', '{\"hitAbility\": 2, \"parry\": -15, \"damage\": 40}', 12, 'artisan'),
(58, 'Iron Claws', 'weapon', 'Great for slicing and dicing tomatoes and foes alike', '/sprites/equipment/iron_claws.png', '{\"hitAbility\": 12, \"parry\": -4, \"damage\": 30}', 12, 'artisan'),
(59, 'Goblin Slayer Club', 'weapon', 'Once used by goblins for clubbing, now used by you for partying', '/sprites/equipment/goblin_slayer_club.png', '{\"hitAbility\": 15, \"parry\": -6, \"damage\": 40}', 16, 'knightly'),
(60, 'Steel Scythe', 'weapon', 'Normally used for cutting grass, now used for cutting down your enemies', '/sprites/equipment/steel_scythe.png', '{\"hitAbility\": 10, \"parry\": -6, \"damage\": 60}', 20, 'knightly'),
(61, 'Steel Katana', 'weapon', 'Owning this won\'t make you a weeb. You\'ll just look like one.', '/sprites/equipment/steel_katana.png', '{\"hitAbility\": 14, \"parry\": 10, \"damage\": 40}', 20, 'knightly'),
(62, 'Steel Beam', 'weapon', 'Literally an I-Beam for constructing the Empire State Building or a dutch apartment.', '/sprites/equipment/steel_beam.png', '{\"hitAbility\": -12, \"parry\": 18, \"armor\": 38}', 20, 'knightly'),
(63, 'Steel Pavise', 'weapon', 'In a bygone era, this was used to shield entire bodies. Now it will shield yours.', '/sprites/equipment/steel_pavise.png', '{\"parry\": 12, \"armor\": 30, \"magicResistance\": 20}', 20, 'knightly'),
(64, 'Steel Ball', 'weapon', 'Enemies will be so confused why you\'re holding a steel ball that they won\'t even notice when you\'re beating them with it', '/sprites/equipment/steel_ball.png', '{\"hitAbility\": 12, \"damage\": 35}', 20, 'knightly'),
(65, 'Steel Rod', 'weapon', 'Extremely simple, yet plainly effective. Also, who\'s Rod?', '/sprites/equipment/steel_rod.png', '{\"hitAbility\": 10, \"parry\": 15, \"damage\": 30}', 20, 'knightly'),
(66, 'Steel Greatsword', 'weapon', 'A rather heavy sword, very hard to use but you\'ll do a lot of damage', '/sprites/equipment/steel_greatsword.png', '{\"hitAbility\": -10, \"parry\": 6, \"damage\": 70}', 20, 'knightly'),
(67, 'Ancient Staff', 'weapon', 'Looted from other-worldly temples, it contains remnant energies of old Gods', '/sprites/equipment/ancient_staff.png', '{\"hitAbility\": 4, \"damage\": 20, \"magicPenetration\": 30}', 20, 'knightly'),
(68, 'Ancient Flail', 'weapon', 'Found in the bottom of a pyramid in the jungle, it has faint hints of dried blood', '/sprites/equipment/ancient_flail.png', '{\"hitAbility\": 12, \"damage\": 30, \"magicResistance\": 30}', 20, 'knightly'),
(69, 'Ancient Tome', 'weapon', 'You can\'t read what it says, but it still works to protect you with magical energies', '/sprites/equipment/ancient_tome.png', '{\"hitAbility\": 6, \"magicResistance\": 20, \"manaRegeneration\": 80}', 20, 'knightly'),
(70, 'Ancient Talisman', 'weapon', 'No one knows who first unlocked this talisman\'s runes, but they seem to be extremely potent in both attack and defense', '/sprites/equipment/ancient_talisman.png', '{\"magicPenetration\": 25, \"magicResistance\": 25, \"manaRegeneration\": 20}', 20, 'knightly'),
(71, 'Ancient Scepter', 'weapon', 'Magically bonk your enemies with a scepter once held by a wizard from time immemorial who rose to power masquerading as a prince he had assassinated years prior.', '/sprites/equipment/ancient_scepter.png', '{\"hitAbility\": 10, \"magicPenetration\": 15, \"damage\": 20}', 20, 'knightly'),
(72, 'Obsidian Dagger', 'weapon', 'The best weapon to attack a geologist with. A geologist would be too busy telling you facts about obsidian to notice you were stabbing them', '/sprites/equipment/obsidian_dagger.png', '{\"hitAbility\": 20, \"parry\": -20, \"damage\": 100}', 30, 'noble'),
(73, 'Obsidian Machete', 'weapon', 'Hacking and slashing with volcanic glass! What could be cooler?!', '/sprites/equipment/obsidian_machete.png', '{\"hitAbility\": 8, \"parry\": 9, \"damage\": 80}', 30, 'noble'),
(74, 'Obsidian Hatchet', 'weapon', 'Would shatter if you tried to chop a tree with it. But works on enemies for some reason.', '/sprites/equipment/obsidian_hatchet.png', '{\"damage\": 130}', 30, 'noble'),
(75, 'Obsidian Halberd', 'weapon', 'Halberd hears a hoo? Halberd more like Al Bird! The latest Sicilian mafia bird.', '/sprites/equipment/obsidian_halberd.png', '{\"hitAbility\": -10, \"parry\": -10, \"damage\": 180}', 30, 'noble'),
(76, 'Crystal Daggers', 'weapon', 'These crystals are imbued with magical energy. Stabby stabby!', '/sprites/equipment/crystal_daggers.png', '{\"hitAbility\": 13, \"damage\": 60, \"magicPenetration\": 30}', 30, 'noble'),
(77, 'Crystal Shield', 'weapon', 'Magical rocks to magically deflect magical madness!', '/sprites/equipment/crystal_shield.png', '{\"parry\": 14, \"armor\": 40, \"magicResistance\": 30}', 30, 'noble'),
(78, 'Crystal Staff', 'weapon', 'Carved from the corpse of a crystal golem and forged by a mage-smith into a powerful weapon!', '/sprites/equipment/crystal_staff.png', '{\"hitAbility\": 10, \"parry\": 10, \"magicPenetration\": 30, \"magicResistance\": 20}', 30, 'noble'),
(79, 'Crystal Ball', 'weapon', 'This ball isn\'t very effective in melee but it allows you to see your enemy\'s attacks before they come, allowing you to evade them effectively!', '/sprites/equipment/crystal_ball.png', '{\"parry\": 20, \"magicResistance\": 35, \"manaRegen\": 60}', 30, 'noble'),
(80, 'Crimson Dagger', 'weapon', 'A weapon that plants itself in the hearts of its enemies.', '/sprites/equipment/crimson_dagger.png', '{\"damage\": 10}', 99, 'noble'),
(81, 'Dragon Blades', 'weapon', 'Twin blades slicing with the fury of a red dragon\'s claws', '/sprites/equipment/dragon_blades.png', '{\"damage\": 10}', 99, 'kingly'),
(82, 'Banana Gun', 'weapon', 'A funny gun that will trip up monsters.', '/sprites/equipment/banana_gun.png', '{\"damage\": 10}', 99, 'kingly'),
(83, 'Dragon Slayer(Berserk)', 'weapon', 'A brutal dragon slaying sword that Guts used to slay the apostles.', '/sprites/equipment/dragon_slayer(berserk).png', '{\"damage\": 10}', 99, 'kingly'),
(84, 'Elucidator and Dark Repulser(SAO)', 'weapon', 'Legendary blades from the legendary dual wielder of Sword Art Online', '/sprites/equipment/elucidator_and_dark_repulser(sao).png', '{\"damage\": 10}', 99, 'emperor'),
(900, 'Stone Gate Key', 'key', 'This key can open a gate for 48 hours.', '/sprites/StoneKey.png', NULL, 0, 'key'),
(901, 'Silver Gate Key', 'key', 'This key can open a gate for 1-week', '/sprites/SilverKey.png', NULL, 0, 'key'),
(902, 'Golden Gate Key', 'key', 'This key can open a gate for 2-weeks', '/sprites/GoldKey.png', NULL, 0, 'key'),
(903, 'Cursed Gate Key', 'key', 'This key cannot be bought and has an incredibly long duration in exchange for a very small radius. ', '/sprites/CursedKey.png', NULL, 0, 'cursed'),
(905, 'A', 'furniture', '', '/sprites/furniture/a.png', NULL, 0, ''),
(906, 'B', 'furniture', '', '/sprites/furniture/b.png', NULL, 0, ''),
(907, 'BlackArrowBottom', 'furniture', '', '/sprites/furniture/blackarrowbottom.png', NULL, 0, ''),
(908, 'BlackArrowBottomLeft', 'furniture', '', '/sprites/furniture/blackarrowbottomleft.png', NULL, 0, ''),
(909, 'BlackArrowBottomRight', 'furniture', '', '/sprites/furniture/blackarrowbottomright.png', NULL, 0, ''),
(910, 'BlackArrowLeft', 'furniture', '', '/sprites/furniture/blackarrowleft.png', NULL, 0, ''),
(911, 'BlackArrowRight', 'furniture', '', '/sprites/furniture/blackarrowright.png', NULL, 0, ''),
(912, 'BlackArrowTop', 'furniture', '', '/sprites/furniture/blackarrowtop.png', NULL, 0, ''),
(913, 'BlackArrowTopLeft', 'furniture', '', '/sprites/furniture/blackarrowtopleft.png', NULL, 0, ''),
(914, 'BlackArrowTopRight', 'furniture', '', '/sprites/furniture/blackarrowtopright.png', NULL, 0, ''),
(915, 'BlueCarpet', 'furniture', '', '/sprites/furniture/bluecarpet.png', NULL, 0, ''),
(916, 'BluePainting', 'furniture', '', '/sprites/furniture/bluepainting.png', NULL, 0, ''),
(917, 'BlueStripes', 'furniture', '', '/sprites/furniture/bluestripes.png', NULL, 0, ''),
(918, 'BlueTiles', 'furniture', '', '/sprites/furniture/bluetiles.png', NULL, 0, ''),
(919, 'Bonfire', 'furniture', '', '/sprites/furniture/bonfire.png', NULL, 0, ''),
(920, 'BowlingBall', 'furniture', '', '/sprites/furniture/bowlingball.png', NULL, 0, ''),
(921, 'BrokenHeart', 'furniture', '', '/sprites/furniture/brokenheart.png', NULL, 0, ''),
(922, 'C', 'furniture', '', '/sprites/furniture/c.png', NULL, 0, ''),
(923, 'Contract', 'furniture', '', '/sprites/furniture/contract.png', NULL, 0, ''),
(924, 'CrappyTrophy', 'furniture', '', '/sprites/furniture/crappytrophy.png', NULL, 0, ''),
(925, 'CrimsonStripes', 'furniture', '', '/sprites/furniture/crimsonstripes.png', NULL, 0, ''),
(926, 'CrimsonTiles', 'furniture', '', '/sprites/furniture/crimsontiles.png', NULL, 0, ''),
(927, 'D', 'furniture', '', '/sprites/furniture/d.png', NULL, 0, ''),
(928, 'DonutPiano', 'furniture', '', '/sprites/furniture/donutpiano.png', NULL, 0, ''),
(929, 'E', 'furniture', '', '/sprites/furniture/e.png', NULL, 0, ''),
(930, 'F', 'furniture', '', '/sprites/furniture/f.png', NULL, 0, ''),
(931, 'FloppyStar', 'furniture', '', '/sprites/furniture/floppystar.png', NULL, 0, ''),
(932, 'FullHeart', 'furniture', '', '/sprites/furniture/fullheart.png', NULL, 0, ''),
(933, 'G', 'furniture', '', '/sprites/furniture/g.png', NULL, 0, ''),
(934, 'GreenBall', 'furniture', '', '/sprites/furniture/greenball.png', NULL, 0, ''),
(935, 'GreenStripe', 'furniture', '', '/sprites/furniture/greenstripe.png', NULL, 0, ''),
(936, 'GreenTiles', 'furniture', '', '/sprites/furniture/greentiles.png', NULL, 0, ''),
(937, 'H', 'furniture', '', '/sprites/furniture/h.png', NULL, 0, ''),
(938, 'Horseshoe', 'furniture', '', '/sprites/furniture/horseshoe.png', NULL, 0, ''),
(939, 'I', 'furniture', '', '/sprites/furniture/i.png', NULL, 0, ''),
(940, 'IceCubey', 'furniture', '', '/sprites/furniture/icecubey.png', NULL, 0, ''),
(941, 'J', 'furniture', '', '/sprites/furniture/j.png', NULL, 0, ''),
(942, 'Jail', 'furniture', '', '/sprites/furniture/jail.png', NULL, 0, ''),
(943, 'K', 'furniture', '', '/sprites/furniture/k.png', NULL, 0, ''),
(944, 'L', 'furniture', '', '/sprites/furniture/l.png', NULL, 0, ''),
(945, 'Lamp', 'furniture', '', '/sprites/furniture/lamp.png', NULL, 0, ''),
(946, 'Lemon', 'furniture', '', '/sprites/furniture/lemon.png', NULL, 0, ''),
(947, 'LilCow', 'furniture', '', '/sprites/furniture/lilcow.png', NULL, 0, ''),
(948, 'LilTophatDude', 'furniture', '', '/sprites/furniture/liltophatdude.png', NULL, 0, ''),
(949, 'M', 'furniture', '', '/sprites/furniture/m.png', NULL, 0, ''),
(950, 'N', 'furniture', '', '/sprites/furniture/n.png', NULL, 0, ''),
(951, 'NavyTiles', 'furniture', '', '/sprites/furniture/navytiles.png', NULL, 0, ''),
(952, 'O', 'furniture', '', '/sprites/furniture/o.png', NULL, 0, ''),
(953, 'OrangeStripes', 'furniture', '', '/sprites/furniture/orangestripes.png', NULL, 0, ''),
(954, 'OrangeTiles', 'furniture', '', '/sprites/furniture/orangetiles.png', NULL, 0, ''),
(955, 'P', 'furniture', '', '/sprites/furniture/p.png', NULL, 0, ''),
(956, 'Pencil', 'furniture', '', '/sprites/furniture/pencil.png', NULL, 0, ''),
(957, 'PipeWater', 'furniture', '', '/sprites/furniture/pipewater.png', NULL, 0, ''),
(958, 'pixil-layer-boobie', 'furniture', '', '/sprites/furniture/pixil_layer_boobie.png', NULL, 0, ''),
(959, 'pixil-layer-cat AAAAAA', 'furniture', '', '/sprites/furniture/pixil_layer_cat_aaaaaa.png', NULL, 0, ''),
(960, 'pixil-layer-cheese', 'furniture', '', '/sprites/furniture/pixil_layer_cheese.png', NULL, 0, ''),
(961, 'pixil-layer-mmmmmiku', 'furniture', '', '/sprites/furniture/pixil_layer_mmmmmiku.png', NULL, 0, ''),
(962, 'pixil-layer-money', 'furniture', '', '/sprites/furniture/pixil_layer_money.png', NULL, 0, ''),
(963, 'pixil-layer-peach', 'furniture', '', '/sprites/furniture/pixil_layer_peach.png', NULL, 0, ''),
(964, 'pixil-layer-plant', 'furniture', '', '/sprites/furniture/pixil_layer_plant.png', NULL, 0, ''),
(965, 'pixil-layer-pog', 'furniture', '', '/sprites/furniture/pixil_layer_pog.png', NULL, 0, ''),
(966, 'pixil-layer-pokemon ball', 'furniture', '', '/sprites/furniture/pixil_layer_pokemon_ball.png', NULL, 0, ''),
(967, 'pixil-layer-tea', 'furniture', '', '/sprites/furniture/pixil_layer_tea.png', NULL, 0, ''),
(968, 'PlagueRat', 'furniture', '', '/sprites/furniture/plaguerat.png', NULL, 0, ''),
(969, 'PurpleStripes', 'furniture', '', '/sprites/furniture/purplestripes.png', NULL, 0, ''),
(970, 'PurpleTiles', 'furniture', '', '/sprites/furniture/purpletiles.png', NULL, 0, ''),
(971, 'Q', 'furniture', '', '/sprites/furniture/q.png', NULL, 0, ''),
(972, 'R', 'furniture', '', '/sprites/furniture/r.png', NULL, 0, ''),
(973, 'RealmsOfExetherCurrency', 'furniture', '', '/sprites/furniture/realmsofexethercurrency.png', NULL, 0, ''),
(974, 'RedArrowBottom', 'furniture', '', '/sprites/furniture/redarrowbottom.png', NULL, 0, ''),
(975, 'RedArrowBottomLeft', 'furniture', '', '/sprites/furniture/redarrowbottomleft.png', NULL, 0, ''),
(976, 'RedArrowBottomRight', 'furniture', '', '/sprites/furniture/redarrowbottomright.png', NULL, 0, ''),
(977, 'RedArrowLeft', 'furniture', '', '/sprites/furniture/redarrowleft.png', NULL, 0, ''),
(978, 'RedArrowRight', 'furniture', '', '/sprites/furniture/redarrowright.png', NULL, 0, ''),
(979, 'RedArrowTop', 'furniture', '', '/sprites/furniture/redarrowtop.png', NULL, 0, ''),
(980, 'RedArrowTopLeft', 'furniture', '', '/sprites/furniture/redarrowtopleft.png', NULL, 0, ''),
(981, 'RedArrowTopRight', 'furniture', '', '/sprites/furniture/redarrowtopright.png', NULL, 0, ''),
(982, 'RedHappyCube', 'furniture', '', '/sprites/furniture/redhappycube.png', NULL, 0, ''),
(983, 'RedStripes', 'furniture', '', '/sprites/furniture/redstripes.png', NULL, 0, ''),
(984, 'RedTiles', 'furniture', '', '/sprites/furniture/redtiles.png', NULL, 0, ''),
(985, 'RottenBanana', 'furniture', '', '/sprites/furniture/rottenbanana.png', NULL, 0, ''),
(986, 'S', 'furniture', '', '/sprites/furniture/s.png', NULL, 0, ''),
(987, 'Swordman', 'furniture', '', '/sprites/furniture/swordman.png', NULL, 0, ''),
(988, 'T', 'furniture', '', '/sprites/furniture/t.png', NULL, 0, ''),
(989, 'TouchGrass', 'furniture', '', '/sprites/furniture/touchgrass.png', NULL, 0, ''),
(990, 'U', 'furniture', '', '/sprites/furniture/u.png', NULL, 0, ''),
(991, 'V', 'furniture', '', '/sprites/furniture/v.png', NULL, 0, ''),
(992, 'W', 'furniture', '', '/sprites/furniture/w.png', NULL, 0, ''),
(993, 'WarningIcon', 'furniture', '', '/sprites/furniture/warningicon.png', NULL, 0, ''),
(994, 'WhiteArrowBottom', 'furniture', '', '/sprites/furniture/whitearrowbottom.png', NULL, 0, ''),
(995, 'WhiteArrowBottomLeft', 'furniture', '', '/sprites/furniture/whitearrowbottomleft.png', NULL, 0, ''),
(996, 'WhiteArrowBottomRight', 'furniture', '', '/sprites/furniture/whitearrowbottomright.png', NULL, 0, ''),
(997, 'WhiteArrowLeft', 'furniture', '', '/sprites/furniture/whitearrowleft.png', NULL, 0, ''),
(998, 'WhiteArrowRight', 'furniture', '', '/sprites/furniture/whitearrowright.png', NULL, 0, ''),
(999, 'WhiteArrowTop', 'furniture', '', '/sprites/furniture/whitearrowtop.png', NULL, 0, ''),
(1000, 'WhiteArrowTopLeft', 'furniture', '', '/sprites/furniture/whitearrowtopleft.png', NULL, 0, ''),
(1001, 'WhiteArrowTopRight', 'furniture', '', '/sprites/furniture/whitearrowtopright.png', NULL, 0, ''),
(1002, 'X', 'furniture', '', '/sprites/furniture/x.png', NULL, 0, ''),
(1003, 'Y', 'furniture', '', '/sprites/furniture/y.png', NULL, 0, ''),
(1004, 'YellowStripe', 'furniture', '', '/sprites/furniture/yellowstripe.png', NULL, 0, ''),
(1005, 'YellowTiles', 'furniture', '', '/sprites/furniture/yellowtiles.png', NULL, 0, ''),
(1006, 'Z', 'furniture', '', '/sprites/furniture/z.png', NULL, 0, '');

-- --------------------------------------------------------

--
-- Table structure for table `quests`
--

CREATE TABLE `quests` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('daily','journey','bounty') DEFAULT NULL,
  `description` text DEFAULT NULL,
  `experience_reward` int(11) DEFAULT NULL,
  `item_reward` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `difficulty` int(11) NOT NULL,
  `stat_reward` text NOT NULL,
  `tags` text NOT NULL DEFAULT '[]',
  `period` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quest_participants`
--

CREATE TABLE `quest_participants` (
  `id` int(11) NOT NULL,
  `quest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `progress` int(11) DEFAULT 0,
  `completed` tinyint(1) DEFAULT 0,
  `joined_at` text NOT NULL DEFAULT current_timestamp(),
  `completed_at` text DEFAULT NULL,
  `expired_at` datetime NOT NULL,
  `joined_at_datetime` datetime NOT NULL,
  `period_completed` int(11) DEFAULT NULL,
  `last_completed_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `reward_seasons`
--

CREATE TABLE `reward_seasons` (
  `season_id` int(11) NOT NULL,
  `day` int(11) NOT NULL,
  `reward_type` varchar(50) NOT NULL,
  `reward_amount` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reward_seasons`
--

INSERT INTO `reward_seasons` (`season_id`, `day`, `reward_type`, `reward_amount`) VALUES
(1, 1, 'gold', 10),
(1, 2, 'xp', 200),
(1, 3, 'gold', 25),
(1, 4, 'xp', 400),
(1, 5, 'gold', 50),
(1, 6, 'xp', 800),
(1, 7, 'gold', 75),
(1, 8, 'gold', 20),
(1, 9, 'xp', 300),
(1, 10, 'gold', 40),
(1, 11, 'xp', 600),
(1, 12, 'gold', 75),
(1, 13, 'xp', 1200),
(1, 14, 'gold', 200);

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_quests`
--

CREATE TABLE `scheduled_quests` (
  `id` int(11) NOT NULL,
  `quest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `schedule_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`schedule_details`)),
  `streak` int(11) DEFAULT 0,
  `last_completed_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `shop_items`
--

CREATE TABLE `shop_items` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_items`
--

INSERT INTO `shop_items` (`id`, `item_id`, `price`) VALUES
(1, 900, 50),
(2, 901, 100),
(3, 902, 150),
(4, 905, 100),
(5, 906, 100),
(6, 907, 100),
(7, 908, 100),
(8, 909, 100),
(9, 910, 100),
(10, 911, 100),
(11, 912, 100),
(12, 913, 100),
(13, 914, 100),
(14, 915, 500),
(15, 916, 500),
(16, 917, 100),
(17, 918, 100),
(18, 919, 500),
(19, 920, 100),
(20, 921, 100),
(21, 922, 100),
(22, 923, 500),
(23, 924, 500),
(24, 925, 100),
(25, 926, 100),
(26, 927, 100),
(27, 928, 100),
(28, 929, 100),
(29, 930, 100),
(30, 931, 100),
(31, 932, 100),
(32, 933, 100),
(33, 934, 100),
(34, 935, 100),
(35, 936, 100),
(36, 937, 100),
(37, 938, 500),
(38, 939, 100),
(39, 940, 100),
(40, 941, 100),
(41, 942, 100),
(42, 943, 100),
(43, 944, 100),
(44, 945, 500),
(45, 946, 500),
(46, 947, 500),
(47, 948, 500),
(48, 949, 100),
(49, 950, 100),
(50, 951, 100),
(51, 952, 100),
(52, 953, 100),
(53, 954, 100),
(54, 955, 100),
(55, 956, 500),
(56, 957, 100),
(57, 958, 10000),
(58, 959, 10000),
(59, 960, 10000),
(60, 961, 10000),
(61, 962, 99999),
(62, 963, 10000),
(63, 964, 10000),
(64, 965, 10000),
(65, 966, 10000),
(66, 967, 10000),
(67, 968, 500),
(68, 969, 100),
(69, 970, 100),
(70, 971, 100),
(71, 972, 100),
(72, 973, 500),
(73, 974, 100),
(74, 975, 100),
(75, 976, 100),
(76, 977, 100),
(77, 978, 100),
(78, 979, 100),
(79, 980, 100),
(80, 981, 100),
(81, 982, 100),
(82, 983, 100),
(83, 984, 100),
(84, 985, 100),
(85, 986, 100),
(86, 987, 100),
(87, 988, 100),
(88, 989, 100),
(89, 990, 100),
(90, 991, 100),
(91, 992, 100),
(92, 993, 100),
(93, 994, 100),
(94, 995, 100),
(95, 996, 100),
(96, 997, 100),
(97, 998, 100),
(98, 999, 100),
(99, 1000, 100),
(100, 1001, 100),
(101, 1002, 100),
(102, 1003, 100),
(103, 1004, 100),
(104, 1005, 100),
(105, 1006, 100);

-- --------------------------------------------------------

--
-- Table structure for table `tower_leaderboard`
--

CREATE TABLE `tower_leaderboard` (
  `id` int(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `floor` int(11) NOT NULL,
  `date` text NOT NULL,
  `username` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tower_players`
--

CREATE TABLE `tower_players` (
  `userId` int(11) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `floor` int(11) NOT NULL,
  `id` varchar(255) NOT NULL,
  `numberOfRuns` int(11) NOT NULL,
  `bossName` text NOT NULL,
  `remainingBossHealth` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `experience` int(11) DEFAULT 0,
  `stats` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '{}' CHECK (json_valid(`stats`)),
  `joined_at` date NOT NULL DEFAULT current_timestamp(),
  `password` varchar(255) NOT NULL,
  `head` varchar(255) NOT NULL,
  `torso` varchar(255) NOT NULL,
  `legs` varchar(255) NOT NULL,
  `feet` varchar(255) NOT NULL,
  `weapon` varchar(255) NOT NULL,
  `inventory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`inventory`)),
  `currency` int(11) NOT NULL,
  `last_spin` datetime DEFAULT NULL,
  `discount` int(11) DEFAULT 0,
  `email` varchar(255) NOT NULL,
  `age` varchar(255) NOT NULL,
  `spells` text NOT NULL,
  `ownedSpells` text DEFAULT '[]',
  `badges` text DEFAULT '[]',
  `perks` text NOT NULL DEFAULT '[]',
  `perkPoints` int(11) NOT NULL,
  `claimedMilestones` text NOT NULL,
  `guild` varchar(255) NOT NULL,
  `questTags` text NOT NULL DEFAULT '[]',
  `spiritHealth` int(11) NOT NULL DEFAULT 50,
  `maxSpiritHealth` int(11) NOT NULL DEFAULT 50,
  `unlockedFloors` text NOT NULL DEFAULT '[]',
  `role` varchar(255) NOT NULL,
  `friends` text NOT NULL DEFAULT '[]',
  `friendRequests` text NOT NULL DEFAULT '[]',
  `sentRequests` text NOT NULL DEFAULT '[]',
  `premium` tinyint(1) NOT NULL,
  `goal` text NOT NULL,
  `gate_rating` float NOT NULL,
  `dailyRewardClaimed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`dailyRewardClaimed`)),
  `missionRewardClaimed` text NOT NULL,
  `roomLayout` text DEFAULT NULL,
  `font` text NOT NULL,
  `dailyMissions` text DEFAULT NULL,
  `progress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progress`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quests`
--
ALTER TABLE `quests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quest_participants`
--
ALTER TABLE `quest_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_2` (`id`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `reward_seasons`
--
ALTER TABLE `reward_seasons`
  ADD PRIMARY KEY (`season_id`,`day`);

--
-- Indexes for table `scheduled_quests`
--
ALTER TABLE `scheduled_quests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shop_items`
--
ALTER TABLE `shop_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tower_players`
--
ALTER TABLE `tower_players`
  ADD PRIMARY KEY (`userId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1007;

--
-- AUTO_INCREMENT for table `quests`
--
ALTER TABLE `quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6506;

--
-- AUTO_INCREMENT for table `quest_participants`
--
ALTER TABLE `quest_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36145;

--
-- AUTO_INCREMENT for table `scheduled_quests`
--
ALTER TABLE `scheduled_quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `shop_items`
--
ALTER TABLE `shop_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=351779;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
