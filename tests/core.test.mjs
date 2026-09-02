import assert from "node:assert/strict";
import { normalizeDomain, normalizeName, calculateLeadScore } from "../packages/core/dist/index.js";

// normalizeDomain tests
assert.equal(normalizeDomain("https://WWW.Example.COM/x"), "example.com");
assert.equal(normalizeDomain("www.test.org"), "test.org");

// normalizeName tests
assert.equal(normalizeName("ACME, Inc."), "acme inc");
assert.equal(normalizeName("  Foo  Bar  "), "foo bar");

// calculateLeadScore tests
const maxScore = calculateLeadScore({
  hasWebsite: true,
  hasEmail: true,
  emailType: "business",
  opportunityCount: 3,
  decisionMakerSignal: 20,
  companyResearchQuality: 15,
  rating: 4.5,
  reviews: 100,
});
assert.equal(maxScore, 100);

const midScore = calculateLeadScore({
  hasWebsite: true,
  hasEmail: true,
  emailType: "business",
  opportunityCount: 3,
  decisionMakerSignal: 10,
  companyResearchQuality: 10,
  rating: 4.5,
  reviews: 100,
});
assert.equal(midScore, 85);

const lowScore = calculateLeadScore({
  hasWebsite: false,
  hasEmail: false,
  emailType: "none",
  opportunityCount: 0,
  decisionMakerSignal: 0,
  companyResearchQuality: 0,
});
assert.equal(lowScore, 0);

console.log("core tests passed");