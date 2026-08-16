// The minimal contract this project needs from a consumer's curated data (e.g. Craft Helper's
// Google Sheet) to join it onto the base layer - just enough to match by name. Deliberately not
// modeled on that sheet's exact schema: the sheet itself is private, Craft-Helper-specific data
// that has no place in a public, general-purpose repo. A consumer supplies their own curated
// records shaped like this (or a superset of it); merge/ and diff/ don't need to know anything
// else about where they came from.
export interface CuratedRecord {
    name: string;
}
