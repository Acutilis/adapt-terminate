# Terminate

An extension to be used with adapt-trackingHub and adapt-tkhub-xAPI to add a terminate button (and confirmation prompt).
This button sends the 'terminate' statement and navigates away to the url specified in `_channel._LaunchData['returnURL']`. If such piece of data does not exist, it navigates to the `fallbackReturnURL` specified in the configuration.


## Installation

* Add the [example JSON](example.json) to `course.json`.
* With [Adapt CLI](https://github.com/adaptlearning/adapt-cli) installed, run `adapt install adapt-terminate`. Alternatively, download the ZIP and extract into the src > extensions directory
* Run an appropriate Grunt task.

## Usage

* A terminate button can be added to the navigation bar.
* Prompts using notify can be triggered on this button.

## Attributes

