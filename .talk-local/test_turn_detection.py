import unittest
from turn_detection import needs_more_speech


class TurnDetectionTests(unittest.TestCase):
    def test_complete_turns_do_not_wait(self):
        for text in ['Hello', 'How are you?', 'Can you hear me?', 'Yes', 'No',
                     'Merhaba', 'Beni duyuyor musun?', 'What is your name?',
                     'My name is Onur.', 'I like playing football.',
                     'Bugün hava güzel.', 'I want a coffee please.',
                     'Let me think. I would like coffee.', 'I do.']:
            with self.subTest(text=text):
                self.assertFalse(needs_more_speech(text))

    def test_incomplete_turns_wait(self):
        for text in ['', 'My name is...', 'I would like to.', 'I want',
                     'I like coffee because', 'Wait, let me think.',
                     'Bir dakika düşünüyorum.', 'Give me a moment.']:
            with self.subTest(text=text):
                self.assertTrue(needs_more_speech(text))


if __name__ == '__main__':
    unittest.main()
