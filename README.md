<div align="center">
  
# 🎬 AE Preset Previewer - FFX to GIF Generator

**Автоматический генератор GIF-превью для ваших пресетов After Effects (.ffx)**

![After Effects](https://img.shields.io/badge/Adobe%20After%20Effects-CC%202018+-9999FF.svg?style=for-the-badge&logo=adobe%20after%20effects&logoColor=white)
![ExtendScript](https://img.shields.io/badge/ExtendScript-ES3-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Required-007808.svg?style=for-the-badge&logo=ffmpeg&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

[🇷🇺 Читать на русском](#-руководство-на-русском) | [🇬🇧 Read in English](#-english-guide)

</div>

---

## 🇷🇺 Руководство на русском

**Легковесный скрипт для Adobe After Effects**, который автоматически генерирует качественные `.gif` превью для текстовых пресетов анимации (`.ffx`). 

Больше не нужно применять каждый пресет вручную, чтобы узнать, как он выглядит! Укажите папку с пресетами, и скрипт сделает всю грязную работу за вас: создаст композицию, отрендерит видео, сконвертирует его в идеальную GIF-анимацию с помощью FFmpeg и очистит за собой временные файлы.

### ✨ Возможности

- 🚀 **Полная автоматизация:** Самостоятельно создает сцену (композицию), фоновый слой и текстовый слой для демонстрации пресета.
- 📦 **Пакетная обработка:** Способен обработать сотни `.ffx` файлов за один клик (рекурсивно ищет во всех вложенных папках).
- ⚙️ **Гибкие настройки UI:** Выбор частоты кадров (FPS), ширины итоговой GIF, а также опция удаления исходных видеофайлов.
- 📊 **Прогресс-бар:** Удобный интерфейс информирует о текущем шаге, так что After Effects больше не кажется "зависшим".
- 🎨 **Идеальное качество GIF:** Использует двухпроходные алгоритмы `palettegen` утилиты FFmpeg для создания GIF студийного качества (без "бандинга" и потери цветов).
- 🧹 **Умная очистка:** После завершения процесса все временные композиции удаляются из проекта.

### 🛠 Установка и подготовка

> [!NOTE]  
> Скрипт использует внешний мощный конвертер **FFmpeg** для создания высококачественных GIF, так как встроенный рендер After Effects в GIF работает медленно и может выдавать артефакты. 
> Для работы скрипта необходимо скачать исполняемый файл `ffmpeg` и поместить его в папку `bin` рядом со скриптом.

**Как скачать и установить FFmpeg:**
1. **Для Windows:** Скачайте `ffmpeg.exe` с [официального сайта](https://github.com/BtbN/FFmpeg-Builds/releases) (ищите сборку `ffmpeg-master-latest-win64-gpl.zip`, внутри архива в папке `bin` будет файл `ffmpeg.exe`).
2. **Для Mac OS:** Скачайте `ffmpeg` с [evermeet.cx](https://evermeet.cx/ffmpeg/) (или установите через Homebrew: `brew install ffmpeg`).
3. Создайте папку `bin` в той же директории, где находится скрипт `FFX_to_GIF_Generator.jsx`.
4. Поместите скачанный файл (`ffmpeg.exe` или `ffmpeg`) в эту папку `bin`.

### 🏃‍♂️ Использование

1. Скачайте этот скрипт (`FFX_to_GIF_Generator.jsx`).
2. Убедитесь, что вы скачали FFmpeg и положили его в папку `bin` (как описано выше).
3. Откройте After Effects.
4. В верхнем меню выберите: `File` -> `Scripts` -> `Run Script File...` и укажите `FFX_to_GIF_Generator.jsx`.
4. В появившемся окне интерфейса:
   - **Шаг 1:** Выберите папку, где лежат ваши пресеты `.ffx`.
   - **Шаг 2:** Путь к FFmpeg определится автоматически (он появится как "✅ Найдено в папке /bin").
   - **Шаг 3:** Настройте параметры GIF (FPS, ширину) и отметьте удаление видео-исходников по желанию.
   - Нажмите **🚀 СТАРТ: Сгенерировать GIF**.
5. Наблюдайте за индикатором прогресса. По завершении появится уведомление "Готово!".

---

## 🇬🇧 English Guide

**A lightweight script for Adobe After Effects** that automatically generates high-quality `.gif` previews for text animation presets (`.ffx`).

No more applying presets manually just to see what they look like! Point the script to a folder with your presets, and it does all the dirty work: creates a composition, renders the video, converts it into a perfect GIF animation using FFmpeg, and cleans up temporary files.

### ✨ Features

- 🚀 **Full Automation:** Automatically creates a scene, background solid, and text layer to showcase the preset.
- 📦 **Batch Processing:** Processes hundreds of `.ffx` files in one click (recursively searches all subfolders).
- ⚙️ **Flexible UI Settings:** Allows choosing the frame rate (FPS), GIF width, and an option to keep or delete source videos.
- 📊 **Progress Indicator:** Informative progress bar updates dynamically so After Effects never feels "frozen" during the process.
- 🎨 **Perfect GIF Quality:** Uses FFmpeg's `palettegen` algorithm to create studio-quality GIFs (no banding or color loss).
- 🧹 **Smart Cleanup:** Removes temporary compositions and items from the Render Queue after the process completes.

### 🛠 Setup & Requirements

> [!NOTE]  
> This script uses the external command-line tool **FFmpeg** to create high-quality GIFs because the built-in AE GIF renderer is slow and prone to artifacts. 
> To use the script, you must download the `ffmpeg` executable and place it in the `bin` folder next to the script.

**How to download and install FFmpeg:**
1. **For Windows:** Download `ffmpeg.exe` from the [official builds](https://github.com/BtbN/FFmpeg-Builds/releases) (look for `ffmpeg-master-latest-win64-gpl.zip`, inside the archive in the `bin` folder you'll find `ffmpeg.exe`).
2. **For Mac OS:** Download `ffmpeg` from [evermeet.cx](https://evermeet.cx/ffmpeg/) (or install via Homebrew: `brew install ffmpeg`).
3. Create a folder named `bin` in the same directory as the `FFX_to_GIF_Generator.jsx` script.
4. Place the downloaded executable (`ffmpeg.exe` or `ffmpeg`) into this `bin` folder.

### 🏃‍♂️ How to Use

1. Download this script (`FFX_to_GIF_Generator.jsx`).
2. Make sure you have downloaded FFmpeg and placed it in the `bin` folder (as described above).
3. Open After Effects.
4. Go to the top menu: `File` -> `Scripts` -> `Run Script File...` and select `FFX_to_GIF_Generator.jsx`.
4. In the UI window that appears:
   - **Step 1:** Select the folder containing your `.ffx` presets.
   - **Step 2:** The FFmpeg path will be detected automatically (indicated by "✅ Найдено в папке /bin").
   - **Step 3:** Adjust the GIF settings (FPS, width) and check the "Delete source videos" box if desired.
   - Click **🚀 START: Generate GIF**.
5. Watch the progress bar. Once completed, a "Done!" notification will pop up.

---

## 💻 Under the Hood (For Developers)

- **ExtendScript (ES3)** — Manages the After Effects DOM and UI via `ScriptUI`.
- **CLI (Command Line Interface)** — Executes system commands via `system.callSystem()`.
- **Pipeline:** Creates an 800x600 30fps comp -> applies the preset -> renders using the `Lossless` template -> synchronously calls FFmpeg in a loop for conversion -> cleans up.

---

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, and integrate this code into your own scripts or plugins (including commercial ones).
