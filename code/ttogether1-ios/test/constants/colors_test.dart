import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/constants/colors.dart';

main() {
  test("Test all the kAppBar colors against RGB values", () {
    expect(Palette.kAppBar.red, 33);
    expect(Palette.kAppBar.green, 37);
    expect(Palette.kAppBar.blue, 41);
  });
  test("Test all the kButtonPressed colors against RGB values", () {
    expect(Palette.kButtonPressed.red, 235);
    expect(Palette.kButtonPressed.green, 227);
    expect(Palette.kButtonPressed.blue, 245);
  });
  test("Test all the kButtonCall colors against RGB values", () {
    expect(Palette.kButtonCall.red, 42);
    expect(Palette.kButtonCall.green, 39);
    expect(Palette.kButtonCall.blue, 47);
  });
  test("Test all the kButtonCallLight colors against RGB values", () {
    expect(Palette.kButtonCallLight.red, 237);
    expect(Palette.kButtonCallLight.green, 227);
    expect(Palette.kButtonCallLight.blue, 246);
  });
  test("Test all the kPurple colors against RGB values", () {
    expect(Palette.kPurple.red, 158);
    expect(Palette.kPurple.green, 118);
    expect(Palette.kPurple.blue, 199);
  });
  test("Test all the kBlack colors against RGB values", () {
    expect(Palette.kBlack.red, 0);
    expect(Palette.kBlack.green, 0);
    expect(Palette.kBlack.blue, 0);
  });
  test("Test all the kWhite colors against RGB values", () {
    expect(Palette.kWhite.red, 255);
    expect(Palette.kWhite.green, 255);
    expect(Palette.kWhite.blue, 255);
  });
  test("Test all the kGrey colors against RGB values", () {
    expect(Palette.kGrey.red, 238);
    expect(Palette.kGrey.green, 238);
    expect(Palette.kGrey.blue, 238);
  });
  test("Test all the kDivider colors against RGB values", () {
    expect(Palette.kDivider.red, 128);
    expect(Palette.kDivider.green, 127);
    expect(Palette.kDivider.blue, 128);
  });
  test("Test all the kPink colors against RGB values", () {
    expect(Palette.kPink.red, 231);
    expect(Palette.kPink.green, 146);
    expect(Palette.kPink.blue, 171);
  });
  test("Test all the kRedPink colors against RGB values", () {
    expect(Palette.kRedPink.red, 239);
    expect(Palette.kRedPink.green, 127);
    expect(Palette.kRedPink.blue, 99);
  });
  test("Test all the kGreenYellow colors against RGB values", () {
    expect(Palette.kGreenYellow.red, 185);
    expect(Palette.kGreenYellow.green, 223);
    expect(Palette.kGreenYellow.blue, 116);
  });
  test("Test all the kButtonEnterClass colors against RGB values", () {
    expect(Palette.kButtonEnterClass.red, 191);
    expect(Palette.kButtonEnterClass.green, 230);
    expect(Palette.kButtonEnterClass.blue, 131);
  });
  test("Test all the kVideoBackground colors against RGB values", () {
    expect(Palette.kVideoBackground.red, 7);
    expect(Palette.kVideoBackground.green, 36);
    expect(Palette.kVideoBackground.blue, 64);
  });
  test("Test all the kVideoSurface colors against RGB values", () {
    expect(Palette.kVideoSurface.red, 74);
    expect(Palette.kVideoSurface.green, 68);
    expect(Palette.kVideoSurface.blue, 85);
  });
  test("Test all the kIconVideoSurface colors against RGB values", () {
    expect(Palette.kIconVideoSurface.red, 155);
    expect(Palette.kIconVideoSurface.green, 148);
    expect(Palette.kIconVideoSurface.blue, 162);
  });
  test("Test all the kNotiActionSpotlight colors against RGB values", () {
    expect(Palette.kNotiActionSpotlight.red, 22);
    expect(Palette.kNotiActionSpotlight.green, 180);
    expect(Palette.kNotiActionSpotlight.blue, 190);
  });
  test("Test all the kAskHelpPopup colors against RGB values", () {
    expect(Palette.kAskHelpPopup.red, 139);
    expect(Palette.kAskHelpPopup.green, 200);
    expect(Palette.kAskHelpPopup.blue, 51);
  });
  test("Test all the kIconVideoMic colors against RGB values", () {
    expect(Palette.kIconVideoMic.red, 126);
    expect(Palette.kIconVideoMic.green, 193);
    expect(Palette.kIconVideoMic.blue, 255);
  });
  test("Test all the kIconStarOver colors against RGB values", () {
    expect(Palette.kIconStarOver.red, 251);
    expect(Palette.kIconStarOver.green, 179);
    expect(Palette.kIconStarOver.blue, 48);
  });
  test("Test all the kIconLeave colors against RGB values", () {
    expect(Palette.kIconLeave.red, 254);
    expect(Palette.kIconLeave.green, 119);
    expect(Palette.kIconLeave.blue, 89);
  });
  test("Test all the kIconAskHelp colors against RGB values", () {
    expect(Palette.kIconAskHelp.red, 126);
    expect(Palette.kIconAskHelp.green, 207);
    expect(Palette.kIconAskHelp.blue, 9);
  });
  test("Test all the kInfoBackgroundLight colors against RGB values", () {
    expect(Palette.kInfoBackgroundLight.red, 140);
    expect(Palette.kInfoBackgroundLight.green, 126);
    expect(Palette.kInfoBackgroundLight.blue, 156);
  });
  test("Test all the kInfoBackgroundDark colors against RGB values", () {
    expect(Palette.kInfoBackgroundDark.red, 42);
    expect(Palette.kInfoBackgroundDark.green, 39);
    expect(Palette.kInfoBackgroundDark.blue, 47);
  });
  test("Test all the kBackgroundLoadingColor colors against RGB values", () {
    expect(Palette.kBackgroundLoadingColor.red, 255);
    expect(Palette.kBackgroundLoadingColor.green, 255);
    expect(Palette.kBackgroundLoadingColor.blue, 255);
  });
  test("Test all the kLoadingColor colors against RGB values", () {
    expect(Palette.kLoadingColor.red, 158);
    expect(Palette.kLoadingColor.green, 158);
    expect(Palette.kLoadingColor.blue, 158);
  });
}

// class Palette {
//   static Color kButtonCallLight = Color(0xffede3f6);
//   static Color kPurple = Color(0xFF9e76c7);
//   static Color kBlack = Colors.black;
//   static Color kWhite = Colors.white;
//   static Color kGrey = Colors.grey[200];
//   static Color kDivider = Color(0xff807f80);

//   static Color kPink = Color(0xFFE792AB);
//   static Color kRedPink = Color(0xFFEF7F63);
//   static Color kGreenYellow = Color(0xFFB9DF74);
//   static Color kButtonEnterClass = Color(0xffbfe683);

//   static Color kVideoBackground = Color(0xff072440);
//   static Color kVideoSurface = Color(0xff4a4455);
//   static Color kIconVideoSurface = Color(0xff9b94a2);

//   static Color kNotiActionSpotlight = Color.fromRGBO(22, 180, 190, .4);
//   static Color kNotiActionAskHelp = Color.fromRGBO(126, 207, 9, .4);
//   static Color kAskHelpPopup = Color.fromRGBO(139, 200, 51, .9);

//   static Color kIconVideoMic = Color(0xff7ec1ff);
//   static Color kIconStarOver = Color(0xfffbb330);
//   static Color kIconLeave = Color(0xfffe7759);
//   static Color kIconAskHelp = Color(0xff7ecf09);

//   static Color kInfoBackgroundLight = Color(0xff8c7e9c);
//   static Color kInfoBackgroundDark = Color(0xff2a272f);

//   static Color kBackgroundLoadingColor = Colors.white;
//   static Color kLoadingColor = Colors.grey;
// }
