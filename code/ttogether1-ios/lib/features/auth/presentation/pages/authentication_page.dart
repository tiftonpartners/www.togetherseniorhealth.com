import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/style.dart';
import 'package:tsh/features/auth/presentation/cubit/cubit/auth_cubit.dart';
import 'package:tsh/features/dashboard/presentation/pages/HomePage.dart';

class AuthicationPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        body: BlocBuilder<AuthCubit, AuthState>(
          builder: (BuildContext context, state) {
            return Center(
              child: state is AuthLoading
                  ? const CircularProgressIndicator()
                  : state is AuthLoaded
                      ? HomePage()
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[
                            Container(
                              child: Image.asset('assets/splash.png'),
                              height: MediaQuery.of(context).size.height * 0.08,
                            ),
                            SizedBox(
                              height: 32,
                            ),
                            Container(
                              padding: EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  color: Palette.kGreenYellow.withOpacity(0.5),
                                  border:
                                      Border.all(color: Palette.kVideoSurface)),
                              width: MediaQuery.of(context).size.width * .8,
                              alignment: Alignment.center,
                              child: Text(
                                "Please see the email from Together Senior Health for your link to join the Moving Together class. For help, call (415) 237-3040.",
                                textAlign: TextAlign.center,
                                style: titleStyle.copyWith(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold
                                ),
                              ),
                            ),
                            (state is AuthError)
                                ? Text(
                                    state.failure.toString(),
                                    style: TextStyle(
                                        color: Colors.red, fontSize: 18),
                                  )
                                : Container()
                          ],
                        ),
            );
          },
        ),
      ),
    );
  }
}
