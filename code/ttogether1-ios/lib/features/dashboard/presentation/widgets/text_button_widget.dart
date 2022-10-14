import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/style.dart';

class TextIconButton extends StatefulWidget {
  const TextIconButton({
    Key key,
    @required this.iconUrl,
    @required this.text,
    @required this.iconColor,
    this.onTap,
    this.color,
    this.textColor,
    this.isRow = false,
  }) : super(key: key);
  final String text, iconUrl;
  final VoidCallback onTap;
  final Color iconColor, color, textColor;
  final bool isRow;

  @override
  _TextIconButtonState createState() => _TextIconButtonState();
}

class _TextIconButtonState extends State<TextIconButton> {
  Duration animationTime = Duration(milliseconds: 300);
  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final height = MediaQuery.of(context).size.height;

    List<Widget> body = [
      SvgPicture.asset(
        widget.iconUrl,
        semanticsLabel: 'A shark?!',
        height: (width < 810 || height < 1080) ? 18 : 20,
      ),
      SizedBox(
        height: 8,
        width: 2,
      ),
      Expanded(
        child: Text(widget.text,
            textAlign: TextAlign.center,
            style: titleStyle.copyWith(
              color: widget.textColor ?? Palette.kButtonCallLight,
              fontSize: (width < 810 || height < 1080) ? 12 : 14,
            )),
      )
    ];
    return Container(
      width: 110,
      height: widget.isRow ? 80 : 100,
      child: Container(
        padding: EdgeInsets.only(top: 3.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Palette.kButtonCall.withOpacity(0.2),
              blurRadius: 5.0, // has the effect of softening the shadow
              spreadRadius: 3.0, // has the effect of extending the shadow

              offset: Offset(
                3.0, // horizontal, move right 10
                5.0, // vertical, move down 10
              ),
            )
          ],
        ),
        child: RawMaterialButton(
          onPressed: () {
            widget.onTap();
          },
          child: widget.isRow
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: body,
                )
              : Column(
                  children: body,
                ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 2.0,
          fillColor: widget.color ?? Palette.kButtonCall,
          padding: const EdgeInsets.all(15.0),
        ),
      ),
    );
  }
}
