(function(thisObj) {
    var FFX2GIF = (function() {
        function isWindows() {
            return $.os.indexOf("Windows") !== -1;
        }

        function trimText(value) {
            return value ? value.replace(/^\s+|\s+$/g, "") : "";
        }

        function quotePath(path) {
            return '"' + path.replace(/"/g, '\\"') + '"';
        }

        function addCandidate(candidates, path) {
            path = trimText(path);
            if (!path) return;

            for (var i = 0; i < candidates.length; i++) {
                if (candidates[i] === path) return;
            }

            candidates.push(path);
        }

        var Ffmpeg = {
            isValid: function(file) {
                if (!file || !file.exists) return false;

                try {
                    var command = quotePath(file.fsName) + " -version";
                    if (isWindows()) {
                        command = 'cmd.exe /c "' + command + '"';
                    }

                    var output = system.callSystem(command);
                    return output && output.toLowerCase().indexOf("ffmpeg version") !== -1;
                } catch (e) {
                    return false;
                }
            },

            resolve: function(scriptFileName) {
                var executableName = isWindows() ? "ffmpeg.exe" : "ffmpeg";
                var scriptFolder = new File(scriptFileName).parent;
                var candidates = [];

                addCandidate(candidates, scriptFolder.fsName + "/bin/" + executableName);

                if (isWindows()) {
                    addCandidate(candidates, system.callSystem('cmd.exe /c "where ffmpeg.exe 2>nul"').split(/\r?\n/)[0]);
                } else {
                    addCandidate(candidates, system.callSystem("/bin/sh -lc 'command -v ffmpeg'"));
                    addCandidate(candidates, "/opt/homebrew/bin/ffmpeg");
                    addCandidate(candidates, "/usr/local/bin/ffmpeg");
                    addCandidate(candidates, "/usr/bin/ffmpeg");
                }

                for (var i = 0; i < candidates.length; i++) {
                    var candidate = new File(candidates[i]);
                    if (this.isValid(candidate)) return candidate;
                }

                return null;
            },

            buildGifCommand: function(ffmpegFile, videoFile, gifFile, fps, width) {
                var filter = "fps=" + fps + ",scale=" + width + ":-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";
                var command = quotePath(ffmpegFile.fsName) + " -i " + quotePath(videoFile.fsName) + " -vf " + quotePath(filter) + " -y " + quotePath(gifFile.fsName);
                return isWindows() ? 'cmd.exe /c "' + command + '"' : command;
            },

            convertToGif: function(job, ffmpegFile, fps, width) {
                if (!job.video.exists) {
                    return { ok: false, skipped: true, name: job.name };
                }

                var output = system.callSystem(this.buildGifCommand(ffmpegFile, job.video, job.gif, fps, width));
                return { ok: job.gif.exists, skipped: false, name: job.name, output: output };
            }
        };

        var Presets = {
            scan: function(folder) {
                var results = [];
                var folderFiles = folder.getFiles();
                if (!folderFiles) return results;

                for (var i = 0; i < folderFiles.length; i++) {
                    var file = folderFiles[i];
                    if (file instanceof Folder) {
                        results = results.concat(this.scan(file));
                    } else if (file instanceof File && file.name.toLowerCase().match(/\.ffx$/)) {
                        results.push(file);
                    }
                }

                return results;
            }
        };

        var Render = {
            disableExistingQueueItems: function() {
                for (var q = 1; q <= app.project.renderQueue.numItems; q++) {
                    try {
                        app.project.renderQueue.item(q).render = false;
                    } catch (e) {}
                }
            },

            getLastKeyframeTime: function(propGroup) {
                var maxTime = 0;
                if (propGroup.numProperties === undefined) return maxTime;

                for (var i = 1; i <= propGroup.numProperties; i++) {
                    var prop = propGroup.property(i);
                    if (prop.propertyType === PropertyType.PROPERTY) {
                        if (prop.numKeys > 0) {
                            var lastKeyTime = prop.keyTime(prop.numKeys);
                            if (lastKeyTime > maxTime) maxTime = lastKeyTime;
                        }
                    } else if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
                        var groupMaxTime = this.getLastKeyframeTime(prop);
                        if (groupMaxTime > maxTime) maxTime = groupMaxTime;
                    }
                }

                return maxTime;
            },

            createPreviewJob: function(ffxFile) {
                var ffxName = decodeURI(ffxFile.name).replace(".ffx", "");
                var compName = "GIF_Prev_" + ffxName.substring(0, 15);
                var comp = app.project.items.addComp(compName, 800, 600, 1.0, 3.0, 30);
                var bgLayer = comp.layers.addSolid([0.15, 0.15, 0.15], "BG", 800, 600, 1.0);
                var textLayer = comp.layers.addText("ANIMATION");
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;

                bgLayer.locked = true;
                textDocument.fontSize = 100;
                textDocument.fillColor = [1, 1, 1];
                textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
                textProp.setValue(textDocument);
                textLayer.position.setValue([comp.width / 2, comp.height / 2]);
                textLayer.applyPreset(ffxFile);

                var lastKeyTime = this.getLastKeyframeTime(textLayer);
                if (lastKeyTime > 0) {
                    var newDuration = Math.max(lastKeyTime, comp.frameDuration);
                    comp.duration = newDuration;
                    bgLayer.locked = false;
                    bgLayer.outPoint = newDuration;
                    bgLayer.locked = true;
                    textLayer.outPoint = newDuration;
                }

                var rqItem = app.project.renderQueue.items.add(comp);
                var outMod = rqItem.outputModule(1);

                try {
                    outMod.applyTemplate("Lossless");
                } catch (e) {
                    try {
                        outMod.applyTemplate("Без потерь");
                    } catch (err) {}
                }

                var ext = "avi";
                if (outMod.file) {
                    var parts = outMod.file.name.split(".");
                    if (parts.length > 1) ext = parts[parts.length - 1];
                } else {
                    ext = isWindows() ? "avi" : "mov";
                }

                var ffxDir = ffxFile.parent.fsName;
                var videoPath = new File(ffxDir + "/" + ffxName + "_temp." + ext);
                outMod.file = videoPath;

                return {
                    comp: comp,
                    rqItem: rqItem,
                    video: videoPath,
                    gif: new File(ffxDir + "/" + ffxName + ".gif"),
                    name: ffxName
                };
            }
        };

        return {
            isWindows: isWindows,
            Ffmpeg: Ffmpeg,
            Presets: Presets,
            Render: Render
        };
    })();

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

            // Автоматический поиск ffmpeg: локальный bin -> системный PATH -> типовые macOS пути
            try {
                var autoFfmpegFile = FFX2GIF.Ffmpeg.resolve($.fileName);
                if (autoFfmpegFile) {
                    fileFfmpeg = autoFfmpegFile;
                    txtFfmpeg.text = fileFfmpeg.fsName;
                } else {
                    txtFfmpeg.text = "Не найден автоматически...";
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
                var isWin = FFX2GIF.isWindows();
                var f = File.openDialog("Найдите скачанный ffmpeg", isWin ? "*.exe" : "*.*");
                if (f) {
                    if (!FFX2GIF.Ffmpeg.isValid(f)) {
                        alert("Выбранный файл не похож на рабочий FFmpeg. Укажите исполняемый файл ffmpeg.");
                        return;
                    }

                    fileFfmpeg = f;
                    txtFfmpeg.text = fileFfmpeg.fsName;
                    checkReady();
                }
            };

            function checkReady() {
                if (folderFFX !== null && fileFfmpeg !== null) {
                    btnGenerate.enabled = true;
                    statusText.text = "Готов к работе!";
                } else {
                    btnGenerate.enabled = false;
                }
            }

            // Главный процесс
            btnGenerate.onClick = function () {
                var files = FFX2GIF.Presets.scan(folderFFX);
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

        try {
            FFX2GIF.Render.disableExistingQueueItems();

            // Создаем отдельную композицию для каждого файла
            for (var i = 0; i < files.length; i++) {
                var ffxFile = files[i];
                var job = FFX2GIF.Render.createPreviewJob(ffxFile);
                tempComps.push(job.comp);
                tempRqItems.push(job.rqItem);
                filesToConvert.push(job);

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

                var result = FFX2GIF.Ffmpeg.convertToGif(item, fileFfmpeg, fps, width);
                if (result.ok) successCount++;

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
