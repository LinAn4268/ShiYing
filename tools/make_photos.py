# -*- coding: utf-8 -*-
"""为 135 条详解生成配图数据：data/photos/detail.json

每张图都来自 Pexels（免费可商用），id 与标题来自站点搜索结果，
写入前逐条 HEAD 校验 CDN 直链，404 直接报错退出。
用法：python tools/make_photos.py [--check]
"""
import io
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'photos', 'detail.json')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

# item_id: (pexels_id, photographer, english_title, chinese_alt)
PHOTOS = {
    # ── 第一章 ───────────────────────────────────────────────
    '1-1-1': (14030654, 'Vladimir Srajber', 'Rays of Sunlight Passing Through Forest Trees',
              '阳光从树林间斜射下来，一道道光柱落在满地落叶上'),
    '1-1-2': (38921470, 'Sevde Altintas', 'Sunlit Forest with Light Rays Through Trees',
              '清晨的树林里，光线穿过枝叶散成放射状的光束'),
    '1-1-3': (28883308, 'Mladen Janic', 'Sunlight Streaming Through Forest Trees',
              '林间透下的阳光照亮苔藓与树根，像一幅自然写生'),
    '1-2-1': (19911809, 'FranDany', 'Hand Holding Camera and Taking Pictures',
              '一双手举着相机取景，镜头对着画外正在发生的事情'),
    '1-2-2': (8114231, 'Annushka Ahuja', 'Photographer Taking Photo with Camera',
              '摄影师举机取景，透过镜头观察眼前的世界'),
    '1-2-3': (5709600, 'Sam Lion', 'Asian photographer taking picture on photo camera',
              '一位摄影师专注地端着相机，在按快门前片刻停顿'),
    '1-3-1': (35154384, 'Afterglow Street', 'Young Boy Learning Photography Outdoors',
              '少年在户外低头摆弄相机，第一次学摄影的样子'),
    '1-3-2': (17751982, 'Hanuman Photo Studio', 'Boy Hiking in the Forest and Using a Camera',
              '徒步者在林间停下脚步，先看再举机、最后才按快门'),
    '1-3-3': (33617350, 'Warner Brenes Quesada', 'Photography Workshop in Costa Rica Outdoors',
              '户外摄影工作坊里，几个人围着讲师学相机操作'),

    # ── 第二章 ───────────────────────────────────────────────
    '2-1-1': (20255589, '', 'SLR Body Camera',
              '一台单反机身侧放在台面上，能看到五棱镜与卡口结构'),
    '2-1-2': (17345669, 'Vladimir Srajber', 'Nikon Z 7 Professional Digital Camera with NIKKOR Lens',
              '装好镜头的全画幅微单正面照，传感器就藏在卡口深处'),
    '2-1-3': (1585373, 'Francesco Paggiaro', 'Photo of Canon Dslr Camera on Table',
              '桌面上的数码单反，机背屏幕与按钮一览无余'),
    '2-2-1': (1150371, 'Rahul Pandit', 'Canon Telephoto Lens',
              '一支长焦镜头上刻着焦距与光圈刻度'),
    '2-2-2': (11884528, 'dlxmedia.hu', 'Camera Lenses on a Wooden Surface',
              '木桌上并排放着几支长度不同的镜头，视角差别一目了然'),
    '2-2-3': (13840942, 'Free Dimensions', 'Sony E Mount 10-18mm F4 OSS Zoom Lens',
              '一支广角变焦镜头，镜身上标着焦段范围与恒定光圈值'),
    '2-2-4': (15491249, 'Nguyen Huy', 'Close up of Camera Lenses',
              '镜头前端玻璃反光，能看清镜片组与最近对焦距离标记'),
    '2-3-1': (9448165, 'Deybson Mallony', 'A Tripod in the Bag',
              '背包侧面绑着一支折叠起来的三脚架'),
    '2-3-2': (30562992, 'Andreas Naslund', 'Professional Photography Equipment Setup with Gear Bags',
              '摄影包摊开，器材与滤镜等附件分格摆放'),
    '2-3-3': (34936109, 'Themba Mtegha', 'Travel Photography Gear in Lilongwe Malawi',
              '旅行摄影装备一字排开，闪光灯与机身放在一起'),
    '2-3-4': (18447532, 'Shafeek', 'Hiking and Photography Equipment and Accessories',
              '徒步摄影装备清单：机身、镜头、气吹、电池与存储卡'),

    # ── 第三章 ───────────────────────────────────────────────
    '3-1-1': (9966438, 'Jordan Rushton', 'Close-up of a Camera Lens',
              '镜头侧面的光圈数值刻度，f/1.8 与 f/8 就刻在这里'),
    '3-1-2': (370659, 'Aris Ioakimidis', 'Black Camera Lens',
              '一支大光圈定焦镜头，前组镜片口径明显更大'),
    '3-1-3': (17919952, 'Tito Cruz', 'Lens in a Camera',
              '装在机身上的镜头，光圈叶片在光线下隐约可见'),
    '3-2-1': (29133542, 'Engin Akyurt', 'Abstract Long Exposure of Flowing Water',
              '慢门拍下的水流，亮部连成一片柔和的白色'),
    '3-2-2': (14900949, 'Sheng-lu Wu', 'Long Exposure of a Splashing Waterfall',
              '飞溅的水花在慢门下被拉成连续的线条'),
    '3-2-3': (31970786, 'Armando Belsoj', 'Serene Black and White Waterfall in Motion',
              '黑白长曝光的瀑布，水流像雾一样铺开'),
    '3-3-1': (14458031, 'Zeeshaan Shabbir', 'Grainy Photo of Woman Walking through Busy Street at Night',
              '夜色街道上的人影，暗部有明显的颗粒感'),
    '3-3-2': (12341575, 'Omar Ramadan', 'Dim Streetlight at Night in Fog',
              '雾里的路灯，光晕在潮气中散开'),
    '3-3-3': (29380853, 'Michal Robak', 'Urban Alley at Night with Streetlight Glow',
              '夜间小巷里路灯照亮的一小片地面'),
    '3-4-1': (1249544, 'Suzy Hazelwood', 'Analog Device on Black Wooden Surface',
              '黑木桌上的老式测光表，中灰就是它的基准'),
    '3-4-2': (19804400, 'Wolfgang Weiser', 'Touch Screen of a Digital Camera',
              '相机背屏上的测光与参数界面'),
    '3-4-3': (38649039, 'Nguyen Tien Thinh', 'Close-up of Vintage Camera Dial Settings',
              '老相机顶部的快门与曝光补偿刻度盘'),
    '3-4-4': (12378647, 'Michael Hodgins', 'Analog Camera Film Rolls and Light Meter',
              '桌上摊开的胶卷盒与测光表，旁边是相机'),

    # ── 第四章 ───────────────────────────────────────────────
    '4-1-1': (7508378, '', 'Close Up Shot of a Black Camera',
              '镜头前组与对焦环的特写，焦点位置决定清晰面'),
    '4-1-2': (15064142, 'Luke Miller', 'Man Looking at a Viewfinder of his Camera',
              '摄影师把眼睛贴在取景器上，用连续对焦追住主体'),
    '4-1-3': (30861213, 'Ebahir', 'Photographer Holding Camera with Viewfinder Display',
              '举机取景的瞬间，取景器里已经框住了主体'),
    '4-1-4': (19545159, 'landsmann', 'Close-up of a Camera Viewfinder with an Image of a Tree',
              '取景器里的一棵树，放大后能看清焦点的边缘'),
    '4-2-1': (10047793, '', 'Green Leaf in Shallow Focus',
              '一片绿叶清清楚楚，背景虚成一片绿色'),
    '4-2-2': (40302938, 'Bao Minh', 'Serene Bokeh and Fern Leaves in Natural Light',
              '蕨叶在柔光里前后分明，背景化成柔和光斑'),
    '4-2-3': (1191318, 'Arun Kumar', 'Shallow Focus Photography of Pink Flowers',
              '一片粉色花丛，只有靠近镜头的那几朵是清晰的'),
    '4-2-4': (1254276, 'Afterglow Street', 'Shallow Focus Photography of Red Flower',
              '红色花朵特写，按下景深预览时背景仍保持柔和'),
    '4-3-1': (36989889, 'Alexander Mass', 'Photographer Holding DSLR Camera Outdoors',
              '摄影师双手托稳相机，手肘贴住身体'),
    '4-3-2': (35805682, 'Soc Nang Dong', 'Photographer Capturing Nature with Nikon Camera',
              '在户外举机拍摄的摄影师，靠稳定姿势抵消抖动'),
    '4-3-3': (29334473, 'Azvern', 'Close-up of Photographer Holding Canon Camera',
              '手持相机的特写，食指落在快门上'),
    '4-3-4': (36232024, 'Pedro H. Novais', 'Outdoor Portrait of Photographer with Camera',
              '黄昏里举着相机的摄影师，光线已经很暗'),

    # ── 第五章 ───────────────────────────────────────────────
    '5-1-1': (38096974, 'Mohadese', 'Dramatic Side Profile Portrait in Warm Light',
              '侧逆光下的侧脸，轮廓被光勾出一道亮边'),
    '5-1-2': (33725717, 'Dan Thy Nguyen', 'Soft Portrait of a Woman by Window Light',
              '窗光下柔和的女子肖像，阴影过渡平缓'),
    '5-1-3': (38068291, 'Margo Evardson', 'Dramatic Portrait with Window Blind Shadows',
              '百叶窗的影子落在脸上，明暗对比强烈'),
    '5-1-4': (34437071, 'Rob Ruth', 'Artistic Portrait of Woman in Shadowed Studio',
              '暗色影棚里的一束侧光，把人物从背景里拉出来'),
    '5-2-1': (27873253, 'Francesco Ungaro', 'An empty room with sunlight coming through the window',
              '空房间里，阳光从窗户斜照到地板上'),
    '5-2-2': (37911512, 'Nuri Askerhan', 'Sunlit Empty Room with Large Windows',
              '大窗照亮的空房间，靠窗亮、往里暗'),
    '5-2-3': (12036087, 'Faruk Tokluoglu', 'Window in Corridor',
              '走廊尽头的窗，天光是唯一的柔光光源'),
    '5-2-4': (33679319, 'ela sultan', 'Bright Empty Room with Open Windows and Sunlight',
              '明亮的空房间，正午硬光在墙上切出清晰的边界'),
    '5-3-1': (25526512, 'Alpha En', 'Photography Studio Lighting Equipment',
              '影棚里的灯架与常亮灯，光线可以直接看见'),
    '5-3-2': (39632819, 'Alexander Zvir', 'Professional Photography Studio Setup with Softboxes',
              '两盏柔光箱从左右夹光，中间是拍摄位置'),
    '5-3-3': (28772541, 'Alpha En', 'Professional Photography Softbox Light Setup',
              '架在灯架上的柔光箱与离机闪光灯'),
    '5-3-4': (33354214, 'AN Nhol', 'Professional Photography Studio Setup with Softbox Lighting',
              '影棚顶部与侧面的灯同时亮起，色温需要统一'),
    '5-4-1': (29546719, 'Joey Cede', 'Moody Foggy Path in Dark Forest Landscape',
              '雾中的林间小路，整体压成低调画面'),
    '5-4-2': (33929659, 'Jiri Ikonomidis', 'Moody Forest Silhouette with Misty Light',
              '雾气里透出的树影，光从背后打过来'),
    '5-4-3': (30343007, 'Andreas Ebner', 'Moody Nighttime Urban Street with Fog and Streetlights',
              '夜里雾中的街道，路灯把光切成一块一块'),

    # ── 第六章 ───────────────────────────────────────────────
    '6-1-1': (1048283, 'Lisa from Pexels', 'Orange and Blue Skies during Sunset',
              '日落时橘红与蓝色的天空各占一半'),
    '6-1-2': (10203721, '', 'Blue and Orange Sky during Sunset',
              '蓝调时刻的天空，自动白平衡最容易在这里偏冷'),
    '6-1-3': (16265015, '', 'Clouds on Sky at Sunset',
              '日落时云层的暖色，最终调子由白平衡决定'),
    '6-1-4': (5573078, 'DWIDO', 'Beautiful Sky during Sunset',
              '同一片晚霞，色温偏移后会呈现完全不同的冷暖'),
    '6-2-1': (6830149, '', 'Mix Colored Paints in Canvas',
              '画布上混开的颜料，颜色彼此靠近又分明'),
    '6-2-2': (31216472, 'Landiva Weber', 'Vibrant Abstract Marbled Texture in Pastel Hues',
              '粉调的大理石纹理，颜色柔和统一'),
    '6-2-3': (30486231, 'Steve A Johnson', 'Vibrant Abstract Colorful Texture Art',
              '大面积撞色里只留一个主色，画面才不散'),
    '6-3-1': (16349262, 'stayhereforu R.', 'Bouquet with Vintage Camera',
              '一束花与一台老相机，像胶片模拟的柔暖色调'),
    '6-3-2': (14111753, 'Rubenstein Rebello', 'Black Camera, a Lens and a Book Lying on a Table',
              '桌上的相机、镜头与一本书，记录拍摄前的准备'),
    '6-3-3': (18291381, '', 'Still Life with Analog Camera and Book',
              '老相机与书本的静物摆拍，色调偏胶片'),

    # ── 第七章 ───────────────────────────────────────────────
    '7-1-1': (29931738, 'Mirza Muneeb', 'Minimalist Landscape with Bare Trees in Fog',
              '雾中几棵枯树，大片的空白压住整个画面'),
    '7-1-2': (12765902, 'Antoinette Hurlimann', 'Ocean View During Foggy Day',
              '雾天的海面只剩一条水平线，远处的小船是一个点'),
    '7-1-3': (39220651, 'Fidan Nazim qizi', 'Misty Forest with Fog and Bare Trees in Monochrome',
              '雾林的黑白影调，疏密与明暗形成对比'),
    '7-2-1': (15131355, 'Diego F. Parra', 'Drone Shot of City Street',
              '无人机俯拍的城市街道，人物只剩几个小点'),
    '7-2-2': (19106295, 'Alina Skazka', 'Birds Eye View on the Street',
              '正上方俯拍的街面，行人的影子被压平'),
    '7-2-3': (14616698, 'Rodolfo Gaion', 'Drone Shot of Cars on the Road',
              '高空斜俯拍的车流，车身朝向一目了然'),
    '7-2-4': (19817620, '', 'Drone Shot of a Busy Street in City',
              '竖构图里被拉长的街道透视'),
    '7-3-1': (27778745, 'Faysal Khan', 'Leading line + rule of thirds in Photography',
              '公路的引导线落在三分线上，远处是地平线'),
    '7-3-2': (19376404, 'Joao Saplak', 'Reflection of a Building in a Modern Glass Facade',
              '玻璃幕墙里对称倒映的建筑'),
    '7-3-3': (18623921, 'James Davis', 'City Road in Perspective and Skyscrapers on the Horizon',
              '城市道路把视线一路引向远处的楼群'),
    '7-3-4': (4451707, 'Vlada Karpovich', 'Gray Building Reflecting in the Side Mirror',
              '后视镜里倒映的建筑，画面干净只剩两三个元素'),
    '7-3-5': (40639232, 'Andry Sasongko', 'Modern Architectural Masterpiece with Reflection',
              '规整的建筑线条里，倒影打破了一部分对称'),
    '7-4-1': (12638893, 'Nicolas Rueda', 'Road in Perspective, and Gray Smoke',
              '笔直的路面在远处收成一点'),
    '7-4-2': (24819000, 'Lynn', 'View of an Asphalt Street between Trees in Bright Sunlight',
              '阳光穿过树列，远处的路面被雾气压淡'),
    '7-4-3': (14337600, 'Amaury Michaux', 'Lines on Asphalt Road',
              '沥青路面上的车道线向远处延伸'),

    # ── 第八章 ───────────────────────────────────────────────
    '8-1-1': (36116894, 'Alef Morais', 'Golden Hour Outdoor Portrait of a Woman',
              '黄金时刻的户外人像，背景被压缩得很近'),
    '8-1-2': (31899929, 'Fernanda Leticia', 'Portrait of Woman in Golden Hour Outdoors',
              '逆光下的人像，眼睛是画面里最清楚的地方'),
    '8-1-3': (32070991, 'Toni Ferreira', 'Portrait of a Young Woman in Soft Golden Light',
              '柔光里的侧脸，颧骨与鼻梁的阴影很轻'),
    '8-1-4': (28638693, 'Daniil Kondrashin', 'Golden Hour Portrait of Woman Outdoors',
              '人物站在户外，背景的树木虚化成色块'),
    '8-1-5': (36116886, 'Alef Morais', 'Warm Golden Hour Portrait of Young Woman',
              '黄昏里的人物半身像，动作停在转身的一瞬'),
    '8-2-1': (1526713, 'Francesco Ungaro', 'Mountain and Lake',
              '湖面倒映雪山，近处的岸石当前景'),
    '8-2-2': (33673332, 'M.Emin Bilir', 'Serene Mountain Lake at Sunrise Reflection',
              '日出时分的湖面，天光刚刚爬上山顶'),
    '8-2-3': (28794208, 'Alina Chernii', 'Scenic Mountain Lake at Sunrise with Reflections',
              '清晨的湖面平滑如镜，倒影没有一丝波纹'),
    '8-2-4': (37991037, 'PM Photography', 'Panoramic View of Alpine Valley in Summer',
              '宽幅的山谷全景，接片时每张都要留出重叠'),
    '8-2-5': (29734980, 'Ilia Bronskiy', 'Sunrise Over Matterhorn and Reflective Lake',
              '马特洪峰日出，雪面与暗部反差极大'),
    '8-3-1': (32655130, 'Peter Platou', 'Motion Blur of Athlete Running at Sports Field',
              '跑道上冲刺的运动员，动作被高速快门定住'),
    '8-3-2': (11606308, 'Levent Tatli', 'Long Exposure of Person Running',
              '长曝光下奔跑的人变成一道流动的虚影'),
    '8-3-3': (12125324, 'Nick Gosset', 'A Blurry Shot of a Man Running',
              '摇拍下的人影，主体尚清、背景被拉成横线'),
    '8-3-4': (39103618, 'Jean-Daniel Francoeur', 'Dynamic Motion Blur of Athlete Sprinting Outdoors',
              '户外冲刺的运动员，主体在连续对焦里被咬住'),
    '8-4-1': (6493571, 'Piotr Arnoldes', 'Tasty pizza with arugula leaves on dark background',
              '深色背景上的披萨，俯拍视角把配料摆得很清楚'),
    '8-4-2': (31302045, 'Layanne Aguiar', 'Elegant Japanese Sushi Arrangement with Soy Sauce',
              '寿司的侧光让米饭与鱼肉的质感分开'),
    '8-4-3': (11710928, 'Katerina', 'Flat Lay Photography of Assorted Fruits on Black Round Table',
              '黑色圆桌上摊开的水果平铺，背景干净'),
    '8-4-4': (18543472, 'Oben Kural', 'Top View of a Turkish Dessert and Walnuts',
              '土耳其甜点的俯拍特写，焦点落在坚果上'),
    '8-5-1': (1719229, 'Rick Han', 'Landscape Photography of a City in Nighttime',
              '夜色里的城市天际线，暗部靠高 ISO 换亮度'),
    '8-5-2': (2058911, 'Phil Goulson', 'Time Lapse Photo Of City',
              '长曝光下的城市夜景，车灯连成线'),
    '8-5-3': (16097218, 'Jamal Gasayniev', 'Starry Night Sky over an Illuminated City',
              '星空下的城市灯光，人物与背景的亮度差很难兼顾'),
    '8-5-4': (39072409, 'Zeynep Sude Emek', 'Night Sky Over City with Milky Way and River',
              '银河横在河面上方，前景是城市的灯'),

    # ── 第九章 ───────────────────────────────────────────────
    '9-1-1': (12110342, 'Renan Rezende', 'Light Trails on a Highway',
              '高速公路上的车灯拉成长长的光轨'),
    '9-1-2': (14958174, 'Emre Atesoglu', 'Long Exposure of Cars on a Highway at Night',
              '夜路上的车流，长曝光把移动变成线条'),
    '9-1-3': (28841858, 'Andres Idda Bianchi', 'Long Exposure of Highway Traffic at Night',
              '长曝光后的路面光轨，暗部需要降噪处理'),
    '9-1-4': (315938, 'Pixabay', 'Light Trails on Highway at Night',
              '同一机位连续拍摄得到的车流轨迹'),
    '9-2-1': (29698814, '', 'Panoramic View of Swiss Alpine Landscape',
              '阿尔卑斯山谷的大光比场景，天空与地面相差很多级'),
    '9-2-2': (18122957, 'Arturo A', 'A view of the mountains and valleys from a high vantage point',
              '从高处俯瞰的山谷，近景到远景都要清晰'),
    '9-2-3': (15379272, 'Collab Media', 'Landscape of Mountains under Blue Sky',
              '蓝天下的群山，机位固定后可以连续堆栈'),
    '9-2-4': (16479251, 'Ashok J Kshetri', 'A view of a valley with mountains and a river',
              '河流穿过山谷的宽幅视野，需要多张拼成一张'),
    '9-3-1': (19115818, 'Mihman Duganli', 'Double Exposure Film Photograph of a Person and the Sky',
              '人物与天空叠在一起的胶片多重曝光'),
    '9-3-2': (12297543, 'Mohamed Abdelghaffar', 'Double Exposure Photo of a Man at Sunset and Flowers',
              '人与花在夕阳里叠成两层影像'),
    '9-3-3': (15784886, 'Bryan Lopez Ornelas', 'Abstract Reflected in Glass Man Portrait',
              '隔着玻璃拍下的人像，反光叠出第二层画面'),
    '9-4-1': (31573840, 'Moises Fonseca', 'Dynamic Studio Portrait of a Model in Contrast Lighting',
              '对比强烈的影棚人像，主光与轮廓光分工明确'),
    '9-4-2': (8084580, 'Eyup Beyhan', 'Stylish woman in dark studio with flashlight',
              '暗背景里被一束光打亮的人物'),
    '9-4-3': (10864088, 'Mikhail Konetski', 'Woman in Red Light on Black Background',
              '红色灯光下的暗调人像，光影边缘很硬'),

    # ── 第十章 ───────────────────────────────────────────────
    '10-1-1': (10668293, 'Luis Quintero', 'Close-Up Shot of Black Canon Dslr Camera on Person\'s Hand',
               '手里握着的单反机身，卡槽与电池仓就在手边'),
    '10-1-2': (30399598, 'Markus Winkler', 'Close-up of Camera Control Dials and Buttons',
               '相机顶部的拨盘与按钮，出发前要逐个确认'),
    '10-1-3': (41045418, 'Stephen Leonardi', 'Sleek Black Camera Backpack with Tripod',
               '摄影包与三脚架捆在一起，装备带齐再出门'),
    '10-2-1': (30849948, 'Esmerald Heqimaj', 'Close-Up of Person Adjusting Camera Settings',
               '手指正在拨动相机背屏上的参数'),
    '10-2-2': (13939626, 'Pok Rie', 'Black Dslr Camera on Person\'s Hand',
               '手持相机，机顶的模式盘就在拇指下'),
    '10-2-3': (32203082, 'Irfan Simsar', 'Close-up of a Retro-Style Fujifilm Camera',
               '复古机身的拨盘刻度，用来预设白平衡与照片风格'),
    '10-2-4': (38719534, 'Soc Nang Dong', 'Vintage Style Mirrorless Camera on Wooden Table',
               '木桌上的复古微单，按键布局决定了参数怎么预置'),
    '10-3-1': (36148198, 'Elvin Muradzade', 'Photographer Adjusting Camera Outdoors in Nature',
               '摄影师在户外微调相机，边拍边回看'),
    '10-3-2': (21338020, 'Amar Preciado', 'Man with a Camera on a Tripod Filming the Sunset',
               '三脚架上的相机对着日落，光线方向需要再确认'),
    '10-3-3': (21085240, 'Alan Wang', 'Photographer Sitting by Camera on Tripod on Bank of River in Taipei',
               '摄影师守在河边的三脚架旁，等主体与构图同时到位'),
    '10-3-4': (17913191, 'Elif', 'Photographer with Camera on Tripod on Field',
               '田野里的摄影师，遇到不可逆场景要提前想好预案'),
    '10-4-1': (15558425, 'Kawe Rodrigues', 'Man Checking Photos on Camera',
               '回看相机里的照片，对照参数与光线找原因'),
    '10-4-2': (9909082, 'Ron Lach', 'A Woman Looking at the Photos on the DSLR Camera',
               '在机背屏幕上逐张回看，从废片反推前期问题'),
    '10-4-3': (36776811, 'Hong Quang Official', 'Photographer Shows Camera Display to Friends in Hanoi',
               '把相机屏幕转给同伴看，复盘这张为什么成'),
}


def cdn(pid, w):
    return 'https://images.pexels.com/photos/%d/pexels-photo-%d.jpeg?auto=compress&cs=tinysrgb&w=%d' % (pid, pid, w)


def page_url(pid, title):
    slug = ''.join(c if c.isalnum() else '-' for c in title.lower())
    while '--' in slug:
        slug = slug.replace('--', '-')
    slug = slug.strip('-')
    return 'https://www.pexels.com/photo/%s-%d/' % (slug, pid)


def check(pid):
    req = urllib.request.Request(cdn(pid, 400), method='HEAD', headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200
    except Exception:
        return False


def main():
    items = []
    for i in range(1, 11):
        p = os.path.join(ROOT, 'data', 'detail', 'out', 'ch%d.json' % i)
        d = json.load(io.open(p, encoding='utf-8'))
        for it in d['items']:
            items.append(it['id'])

    missing = [i for i in items if i not in PHOTOS]
    extra = [k for k in PHOTOS if k not in items]
    if missing or extra:
        print('MISSING', missing)
        print('EXTRA', extra)
        sys.exit(1)

    data = {}
    for iid in items:
        pid, ph, title, alt = PHOTOS[iid]
        data[iid] = {
            'id': pid,
            'page': page_url(pid, title),
            'ph': ph or 'Pexels',
            'title': title,
            'alt': alt,
            'src': cdn(pid, 1000),
            'srcset': '%s 640w, %s 1000w' % (cdn(pid, 640), cdn(pid, 1000)),
        }

    if '--check' in sys.argv:
        uniq = sorted({v['id'] for v in data.values()})
        bad = []
        for pid in uniq:
            if not check(pid):
                bad.append(pid)
        print('checked %d unique ids, bad %s' % (len(uniq), bad))
        if bad:
            sys.exit(2)

    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + '\n')
    print('wrote %s items=%d bytes=%d' % (OUT, len(data), os.path.getsize(OUT)))


if __name__ == '__main__':
    main()
