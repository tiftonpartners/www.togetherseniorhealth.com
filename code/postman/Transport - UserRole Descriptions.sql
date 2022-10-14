/*

tp.internal.user : Grants read only access

tp.internal.admin : Can create and edit Providers, Drivers, Vehicles, and Users

tp.internal.accounting : Allows banking data visibility

tp.internal.pr user : Allows notes access and creation

tp.internal.pr admin : Can edit and delete notes for all users

tp.transportationprovider.user : Provider specific read only access

tp.transportationprovider.admin : Provider specific admin privileges

tp.transportationprovider.accounting : Provider specific banking data ACCESS





*/



Update ur set 	 Description = 'Allows banking data visibility.', ModifiedOnUTC = getutcdate() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 where at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'internal' and ur.UserRoleName = 'accounting'
UPDATE ur set 	 Description = 'Can create and edit Providers, Drivers, Vehicles, and Users.', ModifiedOnUTC = getutcdate() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 where at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'internal' and ur.UserRoleName = 'admin'
Update ur set 	 Description = 'Can edit and delete notes for all users.', ModifiedOnUTC = getutcdate() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 where at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'internal' and ur.UserRoleName = 'pr admin'
Update ur set 	 Description = 'Allows notes access and creation.', ModifiedOnUTC = getutcdate() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 where at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'internal' and ur.UserRoleName = 'pr user'
Update ur set 	 Description = 'Grants read only access.', ModifiedOnUTC = getutcdate() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 where at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'internal' and ur.UserRoleName = 'user'
Update ur set 	 Description = 'Provider specific banking data access.', ModifiedOnUTC = getutcdate() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 where at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'transportationprovider' and ur.UserRoleName = 'accounting'
Update ur set 	 Description = 'Provider specific admin privileges.', ModifiedOnUTC = GETUTCDATE() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 WHERE at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'transportationprovider' AND ur.UserRoleName = 'admin'
UPDATE ur SET 	 Description = 'Provider specific read only access.', ModifiedOnUTC = GETUTCDATE() , Modifiedbyuserid = 1	 FROM Users.UserRole AS ur JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID 	 WHERE at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'transportationprovider' AND ur.UserRoleName = 'user'
GO

SELECT
    LOWER(at.ApplicationTitleBC)     ApplicationTitleBC
   ,LOWER(uct.UserCategoryTypeBC)	 UserCategoryTypeBC
   ,LOWER(ur.UserRoleName)			 UserRoleName
   ,ur.Description
   ,ur.ModifiedOnUTC
   ,ur.ModifiedByUserID
FROM
    Users.UserRole                AS ur
    JOIN Lookups.ApplicationTitle AS at ON at.ApplicationTitleID = ur.ApplicationTitleID
    JOIN Lookups.UserCategoryType AS uct ON uct.UserCategoryTypeID = ur.UserCategoryTypeID
WHERE	
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'internal' AND ur.UserRoleName = 'accounting') OR 
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'internal' AND ur.UserRoleName = 'admin') OR 
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'internal' AND ur.UserRoleName = 'pr admin') OR 
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'internal' AND ur.UserRoleName = 'pr user') OR 
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'internal' AND ur.UserRoleName = 'user') OR 
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'transportationprovider' AND ur.UserRoleName = 'accounting') OR 
	(  at.ApplicationTitleBC = 'tp' AND uct.UserCategoryTypeBC = 'transportationprovider' AND ur.UserRoleName = 'admin') OR 
	(  at.ApplicationTitleBC = 'tp' and uct.UserCategoryTypeBC = 'transportationprovider' and ur.UserRoleName = 'user')
ORDER BY
    at.ApplicationTitleBC
   ,uct.UserCategoryTypeBC
   ,ur.UserRoleName