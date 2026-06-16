import unittest

from audit_trailers import score_candidate


class TrailerAuditTests(unittest.TestCase):
    def test_rejects_spider_man_for_spider(self):
        result = score_candidate(
            {"title": "Spider", "year": "2002"},
            "wrong",
            {
                "title": "SPIDER-MAN [2002] - Official Trailer (HD)",
                "author_name": "Sony Pictures Entertainment",
            },
        )
        self.assertEqual(result["status"], "rejected")
        self.assertIn("compound_title_extension:man", result["reasons"])

    def test_accepts_exact_spider_trailer(self):
        result = score_candidate(
            {"title": "Spider", "year": "2002"},
            "correct",
            {
                "title": "Spider (2002) ORIGINAL TRAILER [HD]",
                "author_name": "Unseen Trailers",
            },
        )
        self.assertNotEqual(result["status"], "rejected")
        self.assertIn("title_exact", result["reasons"])

    def test_rejects_conflicting_year(self):
        result = score_candidate(
            {"title": "The Thing", "year": "1982"},
            "wrong-year",
            {
                "title": "The Thing (2011) Official Trailer",
                "author_name": "Universal Pictures",
            },
        )
        self.assertNotEqual(result["status"], "rejected")
        self.assertIn("year_conflict_candidate:2011", result["reasons"])

    def test_allows_adjacent_release_year(self):
        result = score_candidate(
            {"title": "Frida", "year": "2003"},
            "adjacent-year",
            {
                "title": "Frida (2002) Official Trailer",
                "author_name": "Movieclips",
            },
        )
        self.assertEqual(result["status"], "verified")
        self.assertIn("year_near_match:2002", result["reasons"])

    def test_does_not_reject_format_metadata(self):
        result = score_candidate(
            {"title": "My Dog Skip", "year": "2000"},
            "format-metadata",
            {
                "title": "My Dog Skip (2000) 35mm film trailer, flat open matte, 2160p",
                "author_name": "Archive Channel",
            },
        )
        self.assertNotEqual(result["status"], "rejected")

    def test_rejects_wrong_sequel(self):
        result = score_candidate(
            {"title": "Zona Zamfirova", "year": "2002"},
            "wrong-sequel",
            {
                "title": "Zona Zamfirova part 2 - Official Trailer",
                "author_name": "Official Studio",
            },
        )
        self.assertEqual(result["status"], "rejected")
        self.assertTrue(any(reason.startswith("sequel_marker_conflict:") for reason in result["reasons"]))


if __name__ == "__main__":
    unittest.main()
