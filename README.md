# Multibackup

This application allows the user to clone a project into several folders to have it as a backup in case of HD error, system crash or whatever happen that results in the lost of the working directory.

![MultiBackup](multibackup.png)

## Features

* Watch mode, so you don't need to worry about hitting the **RUN** button after do some changes.
* Usb as storage.
* Multiple output directories, allowing you to have more than one copy.
* Exclude directories from clone process.

### Clone

Multibackup actually clone the project, it does not keep a history of previous changes so if watch mode is enabled modification are stored in real time meaning that **revert is not possible from the backups**.


## Future updates

* Allow to save previous versions of the project.
* Start with OS.

    **Done for Windows.**

## Installation

1. Clone the project.
2. Run `npm run build:windows` or `npm run build:linux`.
3. If you are not familiar with node there are compiled versions in previous commits.

**Outdated**
1. Download from /release:

    * [Windows](https://github.com/jesusvimlet/multibackuper/raw/master/release/Multibackup-1.0.0-win.zip)
    * [Linux](https://github.com/jesusvimlet/multibackuper/raw/master/release/multibackup-1.0.0.zip)

2. Unzip wherever you want.

## Usage

1. Run the application and add as many backups as you want.
2. Backups need the project folder and at least one output folder to work.
3. Watch mode means that the application looks for changes.
4. Exclude patterns or folders can be added in options.

## License

This project is developed under MIT license

