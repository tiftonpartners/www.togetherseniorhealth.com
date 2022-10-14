// import 'package:flutter/material.dart';
// import 'package:flutter_bloc/flutter_bloc.dart';
// import 'package:tsh/constants/colors.dart';
// import 'package:tsh/constants/constants.dart';
// import 'package:tsh/features/dashboard/presentation/cubit/join_class/join_class_cubit.dart';

// class CreateTicketWidget extends StatelessWidget {
//   const CreateTicketWidget({
//     Key key,
//     @required this.myController,
//   }) : super(key: key);

//   final TextEditingController myController;

//   @override
//   Widget build(BuildContext context) {
//     return BlocBuilder<JoinClassCubit, JoinClassState>(
//       builder: (context, state) {
//         return Row(
//           mainAxisSize: MainAxisSize.min,
//           children: [
//             Expanded(
//               child: Container(
//                 width: MediaQuery.of(context).size.width * 0.8,
//                 child: TextFormField(
//                   controller: myController..text = Constants.PREFLIGHT_CLASS,
//                   decoration: InputDecoration(
//                     labelText: 'Channel Name or your name',
//                     labelStyle: TextStyle(color: Colors.blue),
//                     hintText: 'test',
//                     hintStyle: TextStyle(color: Colors.black45),
//                     border: OutlineInputBorder(
//                       borderSide: BorderSide(color: Colors.blue),
//                       borderRadius: BorderRadius.circular(20),
//                     ),
//                     enabledBorder: OutlineInputBorder(
//                       borderSide: BorderSide(color: Colors.blue),
//                       borderRadius: BorderRadius.circular(20),
//                     ),
//                     disabledBorder: OutlineInputBorder(
//                       borderSide: BorderSide(color: Colors.blue),
//                       borderRadius: BorderRadius.circular(20),
//                     ),
//                     focusedBorder: OutlineInputBorder(
//                       borderSide: BorderSide(color: Colors.blue),
//                       borderRadius: BorderRadius.circular(20),
//                     ),
//                   ),
//                 ),
//               ),
//             ),
//             SizedBox(
//               width: 8,
//             ),
//             MaterialButton(
//               onPressed: () {
//                 state is JoinClassLoaded
//                     ? context.read<JoinClassCubit>().onClear()
//                     : context
//                         .read<JoinClassCubit>()
//                         .onCreateAgoraTokenOrEnterClass(
//                             channelName: "gg",
//                             preflightClass: myController.text);
//               },
//               height: 40,
//               color: Colors.redAccent,
//               child: state is JoinClassLoading
//                   ? Container(
//                       margin: const EdgeInsets.all(8.0),
//                       width: 16,
//                       height: 16,
//                       child: CircularProgressIndicator(
//                         backgroundColor: Colors.white,
//                         strokeWidth: 2,
//                       ),
//                     )
//                   : Text(
//                       state is JoinClassLoaded ? "Clear" : "Create ticket",
//                       style: TextStyle(color: Colors.white),
//                     ),
//             ),
//             SizedBox(
//               width: 8,
//             ),
//             MaterialButton(
//               onPressed: state is JoinClassLoaded
//                   ? () {
//                       context.read<JoinClassCubit>().onJoin(
//                             agora: state.agora,
//                           );
//                     }
//                   : null,
//               disabledColor: Colors.grey,
//               height: 40,
//               color: Color(0xffbfe683),
//               child: Text(
//                 'Join',
//                 style: TextStyle(color: Palette.kWhite, fontSize: 18),
//               ),
//             ),
//           ],
//         );
//       },
//     );
//   }
// }
