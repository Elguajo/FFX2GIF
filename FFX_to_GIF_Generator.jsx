(function(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "🎬 AE Preset Previewer - FFX to GIF Generator", undefined, {resizeable: true});
        if (win !== null) {
            win.orientation = "column";
            win.alignChildren = ["fill", "top"];
            win.spacing = 15;
            win.margins = 16;

            // --- ПАНЕЛЬ 1: ПУТИ ---
            var panelSettings = win.add("panel", undefined, "📁 Настройки путей");
            panelSettings.orientation = "column";
            panelSettings.alignChildren = ["fill", "top"];
            panelSettings.margins = 20;
            panelSettings.spacing = 15;

            // FFX Folder Group
            var ffxGrp = panelSettings.add("group");
            ffxGrp.orientation = "column";
            ffxGrp.alignChildren = ["fill", "top"];
            ffxGrp.spacing = 5;
            var ffxLabel = ffxGrp.add("statictext", undefined, "1. Папка с .ffx пресетами:");
            var ffxActionGrp = ffxGrp.add("group");
            ffxActionGrp.orientation = "row";
            ffxActionGrp.alignChildren = ["fill", "center"];
            var txtFolder = ffxActionGrp.add("edittext", undefined, "Выберите папку...", {readonly: true});
            txtFolder.preferredSize.width = 200;
            var btnFolder = ffxActionGrp.add("button", undefined, "Обзор");
            btnFolder.preferredSize.width = 80;

            // FFmpeg Group
            var ffmpegGrp = panelSettings.add("group");
            ffmpegGrp.orientation = "column";
            ffmpegGrp.alignChildren = ["fill", "top"];
            ffmpegGrp.spacing = 5;
            var ffmpegLabel = ffmpegGrp.add("statictext", undefined, "2. Путь к FFmpeg (ffmpeg.exe / ffmpeg):");
            var ffmpegActionGrp = ffmpegGrp.add("group");
            ffmpegActionGrp.orientation = "row";
            ffmpegActionGrp.alignChildren = ["fill", "center"];
            var txtFfmpeg = ffmpegActionGrp.add("edittext", undefined, "Укажите утилиту...", {readonly: true});
            txtFfmpeg.preferredSize.width = 200;
            var btnFfmpeg = ffmpegActionGrp.add("button", undefined, "Обзор");
            btnFfmpeg.preferredSize.width = 80;

            // --- ПАНЕЛЬ 2: НАСТРОЙКИ GIF ---
            var panelOptions = win.add("panel", undefined, "⚙️ Настройки GIF");
            panelOptions.orientation = "column";
            panelOptions.alignChildren = ["fill", "top"];
            panelOptions.margins = 20;
            panelOptions.spacing = 15;

            var optionsGrp = panelOptions.add("group");
            optionsGrp.orientation = "row";
            optionsGrp.alignChildren = ["left", "center"];
            optionsGrp.spacing = 20;

            // FPS Dropdown
            var fpsGrp = optionsGrp.add("group");
            fpsGrp.add("statictext", undefined, "FPS:");
            var dropFps = fpsGrp.add("dropdownlist", undefined, ["10", "15", "24", "30", "50", "60"]);
            dropFps.selection = 1; // Default: 15

            // Width Dropdown
            var widthGrp = optionsGrp.add("group");
            widthGrp.add("statictext", undefined, "Ширина (px):");
            var dropWidth = widthGrp.add("dropdownlist", undefined, ["400", "600", "800", "1000", "1280"]);
            dropWidth.selection = 2; // Default: 800

            // Delete Checkbox
            var chkDeleteVideo = panelOptions.add("checkbox", undefined, "Удалять исходные видео после конвертации");
            chkDeleteVideo.value = true;

            var divider = win.add("panel");
            divider.minimumSize.height = divider.maximumSize.height = 2;

            // --- БЛОК ПРОГРЕССА И КНОПКА СТАРТА ---
            var progressGrp = win.add("group");
            progressGrp.orientation = "column";
            progressGrp.alignChildren = ["fill", "top"];
            progressGrp.spacing = 5;
            
            var statusText = progressGrp.add("statictext", undefined, "Укажите пути и нажмите Старт.");
            statusText.justify = "center";
            var progressBar = progressGrp.add("progressbar", undefined, 0, 100);
            progressBar.preferredSize.height = 10;
            progressBar.value = 0;

            var btnGenerate = win.add("button", undefined, "🚀 СТАРТ: Сгенерировать GIF");
            btnGenerate.preferredSize.height = 40;
            btnGenerate.enabled = false;

            // Переменные для хранения путей
            var folderFFX = null;
            var fileFfmpeg = null;
            
            win.onResizing = win.onResize = function() {
                this.layout.resize();
            };

            // Автоматический поиск ffmpeg в папке bin
            try {
                var scriptFolder = new File($.fileName).parent;
                var autoFfmpegName = $.os.indexOf("Windows") !== -1 ? "ffmpeg.exe" : "ffmpeg";
                var autoFfmpegFile = new File(scriptFolder.fsName + "/bin/" + autoFfmpegName);
                if (autoFfmpegFile.exists) {
                    fileFfmpeg = autoFfmpegFile;
                    txtFfmpeg.text = "✅ Найдено в папке /bin";
                    btnFfmpeg.enabled = false;
                }
            } catch(e) {}

            // Логика кнопок
            btnFolder.onClick = function () {
                var f = Folder.selectDialog("Где лежат ваши пресеты?");
                if (f) {
                    folderFFX = f;
                    txtFolder.text = folderFFX.fsName;
                    checkReady();
                }
            };

            btnFfmpeg.onClick = function () {
                var isWin = $.os.indexOf("Windows") !== -1;
                var f = File.openDialog("Найдите скачанный ffmpeg", isWin ? "*.exe" : "*.*");
                if (f) {
                    fileFfmpeg = f;
                    txtFfmpeg.text = fileFfmpeg.fsName;
                    checkReady();
                }
            };

            function checkReady() {
                if (folderFFX !== null && fileFfmpeg !== null) {
                    btnGenerate.enabled = true;
                    statusText.text = "Готов к работе!";
                }
            }

            // Вспомогательная функция для рекурсивного поиска .ffx файлов
            function getFFXFilesRecursive(folder) {
                var results = [];
                var folderFiles = folder.getFiles();
                if (folderFiles) {
                    for (var i = 0; i < folderFiles.length; i++) {
                        var file = folderFiles[i];
                        if (file instanceof Folder) {
                            results = results.concat(getFFXFilesRecursive(file));
                        } else if (file instanceof File && file.name.toLowerCase().match(/\.ffx$/)) {
                            results.push(file);
                        }
                    }
                }
                return results;
            }

            // Главный процесс
            btnGenerate.onClick = function () {
                var files = getFFXFilesRecursive(folderFFX);
                if (files.length === 0) {
                    alert("В выбранной папке нет файлов .ffx!");
                    return;
                }

                btnGenerate.enabled = false;

                // Передаем параметры в глобальную область, чтобы scheduleTask имел к ним доступ
                $.global._ffxToGif_params = {
                    folderFFX: folderFFX,
                    fileFfmpeg: fileFfmpeg,
                    files: files,
                    win: win,
                    fps: parseInt(dropFps.selection.text, 10),
                    width: parseInt(dropWidth.selection.text, 10),
                    deleteVideo: chkDeleteVideo.value,
                    statusText: statusText,
                    progressBar: progressBar,
                    btnGenerate: btnGenerate
                };

                // Откладываем выполнение, чтобы выйти из обработчика onClick.
                // Это необходимо, так как ScriptUI создает неявную группу Undo,
                // которая конфликтует с app.project.renderQueue.render().
                app.scheduleTask("$.global._ffxToGif_process()", 50, false);
            };

            checkReady();
        }
        return win;
    }

    // Глобальная функция для обработки
    $.global._ffxToGif_process = function() {
        var params = $.global._ffxToGif_params;
        if (!params) return;

        var folderFFX = params.folderFFX;
        var fileFfmpeg = params.fileFfmpeg;
        var files = params.files;
        var win = params.win;
        var fps = params.fps;
        var width = params.width;
        var deleteVideo = params.deleteVideo;
        var statusText = params.statusText;
        var progressBar = params.progressBar;
        var btnGenerate = params.btnGenerate;

        var filesToConvert = [];
        var tempComps = [];
        var tempRqItems = [];

        app.beginUndoGroup("Generate GIFs - Setup");

        if (win instanceof Window) {
            statusText.text = "Подготовка сцен в After Effects...";
            progressBar.maxvalue = files.length;
            progressBar.value = 0;
            win.update();
        }

        // Вспомогательная функция для поиска самого позднего ключа
        function getLastKeyframeTime(propGroup) {
            var maxTime = 0;
            if (propGroup.numProperties !== undefined) {
                for (var i = 1; i <= propGroup.numProperties; i++) {
                    var prop = propGroup.property(i);
                    if (prop.propertyType === PropertyType.PROPERTY) {
                        if (prop.numKeys > 0) {
                            var lastKeyTime = prop.keyTime(prop.numKeys);
                            if (lastKeyTime > maxTime) maxTime = lastKeyTime;
                        }
                    } else if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
                        var groupMaxTime = getLastKeyframeTime(prop);
                        if (groupMaxTime > maxTime) maxTime = groupMaxTime;
                    }
                }
            }
            return maxTime;
        }

        try {
            // Отключаем все существующие элементы в очереди рендера
            for (var q = 1; q <= app.project.renderQueue.numItems; q++) {
                try {
                    app.project.renderQueue.item(q).render = false;
                } catch(e) {}
            }

            // Создаем отдельную композицию для каждого файла
            for (var i = 0; i < files.length; i++) {
                var ffxFile = files[i];
                var ffxName = decodeURI(ffxFile.name).replace(".ffx", "");

                // Создаем сцену для рендера (800x600 пикселей, 3 секунды, 30 кадров)
                var compName = "GIF_Prev_" + ffxName.substring(0, 15);
                var comp = app.project.items.addComp(compName, 800, 600, 1.0, 3.0, 30);
                tempComps.push(comp);

                var bgLayer = comp.layers.addSolid([0.15, 0.15, 0.15], "BG", 800, 600, 1.0);
                bgLayer.locked = true;

                var textLayer = comp.layers.addText("ANIMATION");
                
                // Настраиваем размер, цвет и выравнивание текста
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;
                textDocument.fontSize = 100;
                textDocument.fillColor = [1, 1, 1];
                textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
                textProp.setValue(textDocument);
                
                // Выравниваем якорную точку и позицию
                textLayer.position.setValue([comp.width / 2, comp.height / 2]);

                // Применяем пресет
                textLayer.applyPreset(ffxFile);

                // Адаптивная длительность: находим самый поздний ключ после применения пресета
                var lastKeyTime = getLastKeyframeTime(textLayer);
                
                if (lastKeyTime > 0) {
                    var newDuration = lastKeyTime;
                    if (newDuration < comp.frameDuration) {
                        newDuration = comp.frameDuration;
                    }
                    comp.duration = newDuration;
                    
                    bgLayer.locked = false;
                    bgLayer.outPoint = newDuration;
                    bgLayer.locked = true;
                    
                    textLayer.outPoint = newDuration;
                }

                var rqItem = app.project.renderQueue.items.add(comp);
                tempRqItems.push(rqItem);
                var outMod = rqItem.outputModule(1);
                
                // Пытаемся применить шаблон без потерь
                try {
                    outMod.applyTemplate("Lossless"); // Английская версия
                } catch(e) {
                    try {
                        outMod.applyTemplate("Без потерь"); // Русская версия
                    } catch(err) {}
                }
                
                var ext = "avi"; // по умолчанию
                if (outMod.file) {
                    var parts = outMod.file.name.split('.');
                    if (parts.length > 1) {
                        ext = parts[parts.length - 1];
                    }
                } else {
                    ext = ($.os.indexOf("Windows") !== -1) ? "avi" : "mov";
                }
                
                var ffxDir = ffxFile.parent.fsName;
                var videoPath = new File(ffxDir + "/" + ffxName + "_temp." + ext);
                outMod.file = videoPath;

                filesToConvert.push({
                    video: videoPath,
                    gif: new File(ffxDir + "/" + ffxName + ".gif"),
                    name: ffxName
                });

                if (win instanceof Window) {
                    progressBar.value = i + 1;
                    win.update();
                }
            }
        } catch (err) {
            alert("Произошла ошибка при подготовке:\n" + err.toString());
            app.endUndoGroup();
            if (win instanceof Window) { btnGenerate.enabled = true; }
            return;
        }
        app.endUndoGroup();

        try {
            if (win instanceof Window) {
                statusText.text = "Рендер видео в After Effects (Шаг 1 из 2)...";
                progressBar.value = 0;
                progressBar.maxvalue = 100;
                win.update();
            }

            // Запускаем рендер ВСЕХ видео в After Effects
            app.project.renderQueue.render();

            var successCount = 0;
            
            if (win instanceof Window) {
                statusText.text = "Подготовка к конвертации в GIF (Шаг 2 из 2)...";
                progressBar.maxvalue = filesToConvert.length;
                progressBar.value = 0;
                win.update();
            }

            // КОНВЕРТАЦИЯ В GIF ЧЕРЕЗ КОНСОЛЬ (FFmpeg)
            for (var j = 0; j < filesToConvert.length; j++) {
                var item = filesToConvert[j];
                
                if (!item.video.exists) continue;
                
                if (win instanceof Window) {
                    statusText.text = "Конвертация " + (j + 1) + " из " + filesToConvert.length + ": " + item.name;
                    win.update();
                }

                // Эта команда создает оптимизированную GIF с заданными настройками FPS и ширины
                var ffmpegCmd = '"' + fileFfmpeg.fsName + '" -i "' + item.video.fsName + '" -vf "fps=' + fps + ',scale=' + width + ':-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -y "' + item.gif.fsName + '"';
                var cmd = ($.os.indexOf("Windows") !== -1) ? 'cmd.exe /c "' + ffmpegCmd + '"' : ffmpegCmd;
                
                system.callSystem(cmd);
                successCount++;

                // Удаляем временный видеофайл, если стоит галочка
                if (deleteVideo && item.video.exists) {
                    item.video.remove();
                }

                if (win instanceof Window) {
                    progressBar.value = j + 1;
                    win.update();
                }
            }

        } catch (err) {
            alert("Произошла ошибка при рендере или конвертации:\n" + err.toString());
        } finally {
            app.beginUndoGroup("Generate GIFs - Cleanup");
            
            // Удаляем элементы очереди рендера
            for (var r = tempRqItems.length - 1; r >= 0; r--) {
                if (tempRqItems[r]) {
                    try { tempRqItems[r].remove(); } catch(e) {}
                }
            }

            // Удаляем временные композиции
            for (var k = 0; k < tempComps.length; k++) {
                if (tempComps[k]) {
                    try { tempComps[k].remove(); } catch(e) {}
                }
            }
            app.endUndoGroup();
            
            if (win instanceof Window) {
                statusText.text = "Готово!";
                btnGenerate.enabled = true;
                win.update();
            }
            
            if (successCount === 0) {
                alert("⚠️ Рендер не удался! В очереди рендера (Render Queue) возникла ошибка. Проверьте настройки After Effects.");
            } else {
                alert("🔥 Готово! Обработка завершена.\nУспешно создано GIF: " + successCount + " из " + filesToConvert.length + "\nПроверьте вашу папку с пресетами!");
            }
        }
    };

    var myPanel = buildUI(thisObj);
    if (myPanel !== null) {
        if (myPanel instanceof Window) {
            myPanel.center();
            myPanel.show();
        } else {
            myPanel.layout.layout(true);
        }
    }
})(this);
